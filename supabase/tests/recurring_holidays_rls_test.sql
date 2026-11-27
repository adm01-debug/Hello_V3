-- Etapa 122 — gate: feriado recorrente bloqueia todo ano, feriado antigo nao recorrente nao.
-- Tudo dentro de transacao revertida no fim; nada e gravado em producao.

begin;

-- Isola o dia de hoje: nenhum feriado real hoje e BR nao aceita feriado.
select set_config('teste.hoje', (
  (now() AT TIME ZONE coalesce(
     (select c.timezone from public.calling_hours_config c
       where c.region_code = 'BR' and c.is_active limit 1), 'America/Sao_Paulo')
  )::date::text), true);

delete from public.holidays where date = current_setting('teste.hoje')::date;
update public.calling_hours_config set holidays_allowed = false where region_code = 'BR';

-- ---------------------------------------------------------------------------
-- Passo 1: a regra mora na funcao que roda em producao.
-- ---------------------------------------------------------------------------
do $$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.check_calling_hours(text)'::regprocedure);

  if position('recurring' in v_def) = 0 then
    raise exception 'FALHA 1: check_calling_hours nao referencia holidays.recurring';
  end if;
  if position('EXTRACT(MONTH' in upper(v_def)) = 0 or position('EXTRACT(DAY' in upper(v_def)) = 0 then
    raise exception 'FALHA 1: check_calling_hours nao compara mes/dia — feriado recorrente nao bloqueia em outro ano';
  end if;

  raise notice '1/5 ok: a funcao em producao compara mes/dia quando recurring';
end $$;

-- ---------------------------------------------------------------------------
-- Passo 2: feriado recorrente cadastrado no ano passado bloqueia hoje.
-- ---------------------------------------------------------------------------
do $$
declare
  v_res jsonb;
begin
  insert into public.holidays (name, date, is_national, recurring)
  values ('gate-122 recorrente', (current_setting('teste.hoje')::date - interval '1 year')::date, true, true);

  v_res := public.check_calling_hours('BR');

  if (v_res->>'can_call')::boolean then
    raise exception 'FALHA 2: feriado recorrente do ano passado nao bloqueou: %', v_res;
  end if;
  if position('feriado' in lower(v_res->>'reason')) = 0 then
    raise exception 'FALHA 2: bloqueou pelo motivo errado (%): %', v_res->>'reason', v_res;
  end if;

  raise notice '2/5 ok: feriado recorrente de % bloqueou o dia de hoje (%)', (current_setting('teste.hoje')::date - interval '1 year')::date, v_res->>'reason';
end $$;

-- ---------------------------------------------------------------------------
-- Passo 3: feriado do ano passado SEM recurring nao bloqueia hoje (a data exata manda).
-- ---------------------------------------------------------------------------
do $$
declare
  v_res jsonb;
begin
  delete from public.holidays where name = 'gate-122 recorrente';

  insert into public.holidays (name, date, is_national, recurring)
  values ('gate-122 antigo', (current_setting('teste.hoje')::date - interval '1 year')::date, true, false);

  v_res := public.check_calling_hours('BR');

  if position('feriado' in lower(v_res->>'reason')) > 0 then
    raise exception 'FALHA 3: feriado nao recorrente de outro ano bloqueou hoje: %', v_res;
  end if;

  raise notice '3/5 ok: feriado do ano passado sem recurring ignorado (motivo: %)', v_res->>'reason';
end $$;

-- ---------------------------------------------------------------------------
-- Passo 4: feriado de data exata de hoje continua bloqueando (o que a 035 protegia).
-- ---------------------------------------------------------------------------
do $$
declare
  v_res jsonb;
begin
  delete from public.holidays where name = 'gate-122 antigo';

  insert into public.holidays (name, date, is_national, recurring)
  values ('gate-122 hoje', current_setting('teste.hoje')::date, true, false);

  v_res := public.check_calling_hours('BR');

  if (v_res->>'can_call')::boolean then
    raise exception 'FALHA 4: feriado de hoje nao bloqueou: %', v_res;
  end if;

  raise notice '4/5 ok: feriado de data exata de hoje continua bloqueando';
end $$;

-- ---------------------------------------------------------------------------
-- Passo 5: o contrato esta escrito na funcao e na coluna, inclusive a limitacao movel.
-- ---------------------------------------------------------------------------
do $$
declare
  v_fn text;
  v_col text;
begin
  v_fn := obj_description('public.check_calling_hours(text)'::regprocedure, 'pg_proc');
  select d.description into v_col
    from pg_description d
    join pg_attribute a on a.attrelid = d.objoid and a.attnum = d.objsubid
   where d.objoid = 'public.holidays'::regclass
     and d.objsubid > 0
     and a.attname = 'recurring';

  if v_fn is null or position('recurring' in v_fn) = 0 then
    raise exception 'FALHA 5: check_calling_hours sem comentario do contrato de feriado';
  end if;
  if position('movel' in lower(v_fn)) = 0 then
    raise exception 'FALHA 5: o comentario da funcao nao registra a limitacao do feriado movel';
  end if;
  if v_col is null or position('movel' in lower(v_col)) = 0 then
    raise exception 'FALHA 5: holidays.recurring sem comentario da limitacao';
  end if;

  raise notice '5/5 ok: contrato do feriado e limitacao movel documentados na funcao e na coluna';
end $$;

rollback;