-- Gate da etapa 128 -- prova as tres chaves estrangeiras novas, o efeito de ON DELETE SET NULL,
-- a rejeicao de referencia inexistente e que nenhuma FK preexistente foi perdida.
-- Transacao revertida: nada e gravado.

\set ON_ERROR_STOP on

begin;

-- 1. As tres constraints existem, apontam para o destino certo e sao ON DELETE SET NULL.
do $$
declare
  v_def text;
  v_esperado text[] := array[
    'bitrix_departments_parent_id_fkey',
    'coaching_assignments_scorecard_id_fkey',
    'call_scorecards_reviewer_id_fkey'
  ];
  v_nome text;
  v_achados text[] := '{}';
begin
  foreach v_nome in array v_esperado loop
    select pg_get_constraintdef(c.oid) into v_def
      from pg_constraint c
     where c.conname = v_nome
       and c.contype = 'f';

    if v_def is null then
      raise exception 'FALHA 1: a constraint % nao existe', v_nome;
    end if;

    if v_def not like '%ON DELETE SET NULL%' then
      raise exception 'FALHA 1: % foi criada sem ON DELETE SET NULL: %', v_nome, v_def;
    end if;

    v_achados := v_achados || format('%s[%s]', v_nome, v_def);
  end loop;

  raise notice '1/6 ok: as 3 constraints existem com ON DELETE SET NULL (%)', array_to_string(v_achados, ' ');
end $$;

-- 2. Zero orfaos nas tres colunas depois da migration.
do $$
declare v_orf int;
begin
  select count(*) into v_orf from public.bitrix_departments t
   where t.parent_id is not null
     and not exists (select 1 from public.bitrix_departments d where d.id = t.parent_id);
  if v_orf <> 0 then raise exception 'FALHA 2: % orfao(s) em bitrix_departments.parent_id', v_orf; end if;

  select count(*) into v_orf from public.coaching_assignments t
   where t.scorecard_id is not null
     and not exists (select 1 from public.call_scorecards c where c.id = t.scorecard_id);
  if v_orf <> 0 then raise exception 'FALHA 2: % orfao(s) em coaching_assignments.scorecard_id', v_orf; end if;

  select count(*) into v_orf from public.call_scorecards t
   where t.reviewer_id is not null
     and not exists (select 1 from auth.users u where u.id = t.reviewer_id);
  if v_orf <> 0 then raise exception 'FALHA 2: % orfao(s) em call_scorecards.reviewer_id', v_orf; end if;

  raise notice '2/6 ok: 0 orfaos nas 3 colunas';
end $$;

-- 3. Referencia inexistente e rejeitada (a FK esta ativa, nao e decorativa).
do $$
declare v_ok boolean := false;
begin
  begin
    insert into public.coaching_assignments (agent_name, title, scorecard_id)
    values ('gate-128 agente', 'gate-128 atribuicao', gen_random_uuid());
  exception when foreign_key_violation then
    v_ok := true;
  end;

  if not v_ok then
    raise exception 'FALHA 3: o insert com scorecard_id inexistente foi aceito';
  end if;
  raise notice '3/6 ok: scorecard_id inexistente e rejeitado pela FK';
end $$;

-- 4. ON DELETE SET NULL funciona de verdade: apagar o departamento pai desliga o filho.
do $$
declare v_parent text;
begin
  insert into public.bitrix_departments (id, name) values ('gate-128-pai', 'Gate 128 pai');
  insert into public.bitrix_departments (id, name, parent_id)
  values ('gate-128-filho', 'Gate 128 filho', 'gate-128-pai');

  delete from public.bitrix_departments where id = 'gate-128-pai';

  select parent_id into v_parent from public.bitrix_departments where id = 'gate-128-filho';
  if v_parent is not null then
    raise exception 'FALHA 4: parent_id ficou % depois de apagar o pai (esperado null)', v_parent;
  end if;
  raise notice '4/6 ok: apagar o pai nula o parent_id do filho (ON DELETE SET NULL)';
end $$;

-- 5. A coluna que o plano listava e nao tem destino continua fora, e isso e registrado.
do $$
declare v_tipo text; v_fk text;
begin
  select format_type(a.atttypid, a.atttypmod) into v_tipo
    from pg_attribute a
   where a.attrelid = 'public.voip_recommendation_actions'::regclass
     and a.attname = 'recommendation_id';

  select c.conname into v_fk
    from pg_constraint c
   where c.conrelid = 'public.voip_recommendation_actions'::regclass
     and c.contype = 'f'
     and 'recommendation_id' = any (select a2.attname from pg_attribute a2
                                     where a2.attrelid = c.conrelid and a2.attnum = any (c.conkey));

  if v_fk is not null then
    raise exception 'FALHA 5: apareceu FK (%) em voip_recommendation_actions.recommendation_id', v_fk;
  end if;

  raise notice '5/6 ok: recommendation_id (%) segue sem FK - id gerado no cliente pelo motor de recomendacao, sem tabela de destino (a pendencia real e o CHECK do action_type, etapa 139)', v_tipo;
end $$;

-- 6. Regressao: as FKs que ja existiam nessas tabelas continuam no lugar.
do $$
declare
  v_falta text[] := '{}';
  v_n int;
begin
  select count(*) into v_n from pg_constraint
   where conrelid = 'public.coaching_assignments'::regclass and contype = 'f';
  if v_n < 2 then v_falta := v_falta || format('coaching_assignments(%s)', v_n); end if;

  select count(*) into v_n from pg_constraint
   where conrelid = 'public.call_scorecards'::regclass and contype = 'f';
  if v_n < 3 then v_falta := v_falta || format('call_scorecards(%s)', v_n); end if;

  select count(*) into v_n from pg_constraint
   where conrelid = 'public.bitrix_departments'::regclass and contype = 'f';
  if v_n < 1 then v_falta := v_falta || format('bitrix_departments(%s)', v_n); end if;

  if array_length(v_falta, 1) > 0 then
    raise exception 'FALHA 6: FK(s) faltando apos a migration: %', array_to_string(v_falta, ', ');
  end if;
  raise notice '6/6 ok: as FKs preexistentes (call_session_id, template_id, call_session_id de call_scorecards) seguem intactas';
end $$;

rollback;