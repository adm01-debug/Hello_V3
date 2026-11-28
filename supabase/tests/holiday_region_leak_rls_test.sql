-- Gate 126: feriado de outro pais nao pode bloquear a discagem da regiao consultada.
--
-- Em 2026-11-26 check_calling_hours('BR') devolveu can_call = false / 'Hoje e feriado'
-- porque holidays tem 'Thanksgiving' com region_code = 'US' e is_national = true, e o
-- predicado antigo aceitava qualquer is_national = true.
--
-- Roda em transacao revertida: nada fica gravado em producao.
-- Rodar com: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

-- ---------------------------------------------------------------------------
-- 0: estado real de producao. Se hoje tiver feriado mas nenhum dele for da
--    regiao BR, o motivo do bloqueio nao pode ser feriado.
-- ---------------------------------------------------------------------------
do $$
declare
  v_hoje date;
  v_feriados integer;
  v_da_regiao integer;
  v_res jsonb;
begin
  select (now() AT TIME ZONE c.timezone)::date into v_hoje
    from public.calling_hours_config c
   where c.region_code = 'BR' and c.is_active
   limit 1;

  select count(*) into v_feriados
    from public.holidays h
   where h.date = v_hoje
      or (h.recurring
          and extract(month from h.date) = extract(month from v_hoje)
          and extract(day from h.date) = extract(day from v_hoje));

  select count(*) into v_da_regiao
    from public.holidays h
   where (h.date = v_hoje
          or (h.recurring
              and extract(month from h.date) = extract(month from v_hoje)
              and extract(day from h.date) = extract(day from v_hoje)))
     and (h.region_code = 'BR' or (h.region_code is null and h.is_national));

  v_res := public.check_calling_hours('BR');

  if v_feriados > 0 and v_da_regiao = 0 then
    if position('feriado' in lower(coalesce(v_res ->> 'reason', ''))) > 0 then
      raise exception 'FALHA 0: hoje ha % feriado(s), nenhum da regiao BR, e a discagem foi bloqueada por feriado: %',
        v_feriados, v_res;
    end if;
    raise notice '0/3 ok: estado real — % feriado(s) de outra regiao hoje, motivo do bloqueio e "%"',
      v_feriados, v_res ->> 'reason';
  else
    raise notice '0/3 pulado: hoje tem % feriado(s), % da regiao BR', v_feriados, v_da_regiao;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1: feriado nacional de OUTRO pais no dia de hoje nao bloqueia o Brasil.
-- ---------------------------------------------------------------------------
do $$
declare
  v_hoje date;
  v_res jsonb;
begin
  select (now() AT TIME ZONE c.timezone)::date into v_hoje
    from public.calling_hours_config c
   where c.region_code = 'BR' and c.is_active
   limit 1;

  if v_hoje is null then
    raise exception 'FALHA 1: sem calling_hours_config ativa para BR';
  end if;

  -- isola o dia: nenhum feriado real de hoje, e feriado bloqueia de fato
  delete from public.holidays h
   where h.date = v_hoje
      or (h.recurring
          and extract(month from h.date) = extract(month from v_hoje)
          and extract(day from h.date) = extract(day from v_hoje));
  update public.calling_hours_config set holidays_allowed = false where region_code = 'BR';

  insert into public.holidays (name, date, is_national, recurring, region_code)
  values ('gate-126 feriado dos EUA', v_hoje, true, false, 'US');

  v_res := public.check_calling_hours('BR');
  if position('feriado' in lower(coalesce(v_res ->> 'reason', ''))) > 0 then
    raise exception 'FALHA 1: feriado dos EUA bloqueou o Brasil: %', v_res;
  end if;

  raise notice '1/3 ok: feriado nacional dos EUA nao bloqueia BR (motivo: %)', v_res ->> 'reason';
end $$;

-- ---------------------------------------------------------------------------
-- 2: feriado nacional DO Brasil no dia de hoje continua bloqueando.
-- ---------------------------------------------------------------------------
do $$
declare
  v_hoje date;
  v_res jsonb;
begin
  select (now() AT TIME ZONE c.timezone)::date into v_hoje
    from public.calling_hours_config c
   where c.region_code = 'BR' and c.is_active
   limit 1;

  delete from public.holidays where name = 'gate-126 feriado dos EUA';

  insert into public.holidays (name, date, is_national, recurring, region_code)
  values ('gate-126 feriado do Brasil', v_hoje, true, false, 'BR');

  v_res := public.check_calling_hours('BR');
  if (v_res ->> 'can_call')::boolean is distinct from false then
    raise exception 'FALHA 2: feriado nacional do Brasil nao bloqueou a discagem: %', v_res;
  end if;
  if position('feriado' in lower(coalesce(v_res ->> 'reason', ''))) = 0 then
    raise exception 'FALHA 2: bloqueou pelo motivo errado: %', v_res;
  end if;

  raise notice '2/3 ok: feriado nacional do Brasil bloqueia BR (%)', v_res ->> 'reason';
end $$;

-- ---------------------------------------------------------------------------
-- 3: feriado nacional SEM regiao (como a tela grava) continua bloqueando.
--    src/components/compliance/HolidaysManager.tsx:46 grava region_code = null
--    quando is_national = true.
-- ---------------------------------------------------------------------------
do $$
declare
  v_hoje date;
  v_res jsonb;
begin
  select (now() AT TIME ZONE c.timezone)::date into v_hoje
    from public.calling_hours_config c
   where c.region_code = 'BR' and c.is_active
   limit 1;

  delete from public.holidays where name = 'gate-126 feriado do Brasil';

  insert into public.holidays (name, date, is_national, recurring, region_code)
  values ('gate-126 nacional sem regiao', v_hoje, true, false, null);

  v_res := public.check_calling_hours('BR');
  if (v_res ->> 'can_call')::boolean is distinct from false then
    raise exception 'FALHA 3: feriado nacional sem regiao nao bloqueou a discagem: %', v_res;
  end if;

  raise notice '3/3 ok: feriado nacional sem regiao bloqueia BR (%)', v_res ->> 'reason';
end $$;

\echo '=== fim: nada foi gravado (rollback) ==='
rollback;