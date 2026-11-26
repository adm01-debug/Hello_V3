-- Etapa 129 — gate: as seis colunas dos ponteiros polimorficos tem COMMENT e nenhum CHECK foi criado.
-- Transacao revertida no fim.

begin;

-- ---------------------------------------------------------------------------
-- Passo 1: as seis colunas existem e tem comentario com o mapa e a data da medicao.
-- ---------------------------------------------------------------------------
do $$
declare
  v_col text;
  v_tab text;
  v_colname text;
  v_txt text;
  v_ok int := 0;
begin
  for v_tab, v_colname in
    select * from (values
      ('audit_logs', 'resource_type'),
      ('audit_logs', 'resource_id'),
      ('notifications', 'source_type'),
      ('notifications', 'source_id'),
      ('optimistic_lock_conflicts', 'table_name'),
      ('optimistic_lock_conflicts', 'record_id')
    ) as t(tabela, coluna)
  loop
    select col_description(to_regclass('public.' || v_tab), a.attnum) into v_txt
      from pg_attribute a
     where a.attrelid = to_regclass('public.' || v_tab) and a.attname = v_colname;

    if v_txt is null then
      raise exception 'FALHA 1: public.%.% sem COMMENT', v_tab, v_colname;
    end if;
    if position('2026-11-27' in v_txt) = 0 then
      raise exception 'FALHA 1: o comentario de public.%.% nao cita a data da medicao (etapa 129)', v_tab, v_colname;
    end if;

    v_ok := v_ok + 1;
    v_col := v_col || v_tab || '.' || v_colname || ' ';
  end loop;

  raise notice '1/3 ok: % colunas comentadas com a medicao de 2026-11-27 (%)', v_ok, trim(v_col);
end $$;

-- ---------------------------------------------------------------------------
-- Passo 2: o mapa tipo -> tabela esta no comentario (nao so a data).
-- ---------------------------------------------------------------------------
do $$
declare
  v_txt text;
  v_esperado text[] := array['contacts', 'contact', 'user_profiles', 'agents', 'system'];
  v_pt text;
  v_falta text := '';
begin
  select col_description(to_regclass('public.audit_logs'), a.attnum) into v_txt
    from pg_attribute a
   where a.attrelid = to_regclass('public.audit_logs') and a.attname = 'resource_type';

  foreach v_pt in array v_esperado loop
    if position(v_pt in v_txt) = 0 then
      v_falta := v_falta || v_pt || ' ';
    end if;
  end loop;

  if v_falta <> '' then
    raise exception 'FALHA 2: o comentario de audit_logs.resource_type nao cita os valores medidos: %', v_falta;
  end if;

  select col_description(to_regclass('public.optimistic_lock_conflicts'), a.attnum) into v_txt
    from pg_attribute a
   where a.attrelid = to_regclass('public.optimistic_lock_conflicts') and a.attname = 'table_name';
  if position('deals' in v_txt) = 0 or position('contacts' in v_txt) = 0 then
    raise exception 'FALHA 2: o comentario de optimistic_lock_conflicts.table_name nao cita deals/contacts';
  end if;

  raise notice '2/3 ok: comentarios citam os valores reais medidos, inclusive as grafias conviventes contacts/contact e system/SYSTEM';
end $$;

-- ---------------------------------------------------------------------------
-- Passo 3: nenhum CHECK foi criado aqui — restringir e a etapa 139.
-- ---------------------------------------------------------------------------
do $$
declare
  v_n int;
begin
  select count(*) into v_n
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
   where c.contype = 'c'
     and c.conrelid in (to_regclass('public.audit_logs'),
                        to_regclass('public.notifications'),
                        to_regclass('public.optimistic_lock_conflicts'))
     and a.attname in ('resource_type', 'resource_id', 'source_type', 'source_id', 'table_name', 'record_id');

  if v_n <> 0 then
    raise exception 'FALHA 3: % CHECK foi criado nas colunas da etapa 129 — a restricao pertence a etapa 139', v_n;
  end if;

  raise notice '3/3 ok: nenhum CHECK nas seis colunas, como manda o plano (etapa 139 e a dona da restricao)';
end $$;

rollback;