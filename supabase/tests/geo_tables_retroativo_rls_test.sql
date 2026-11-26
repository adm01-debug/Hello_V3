-- Gate da etapa 130 (achado A-091): as tres tabelas geo_* precisam existir com o
-- MESMO formato de producao, porque ate agora elas nasciam direto no banco e um
-- ambiente novo nao as reproduzia.
--
-- A lista esperada abaixo e o snapshot real do catalogo de producao (pg_class,
-- pg_attribute, pg_attrdef, pg_constraint, pg_index, pg_policies, pg_trigger). Se a
-- migration 20261127140000_create_geo_tables_retroativo.sql divergir do banco de
-- verdade, um destes passos falha -- ou seja, este gate e a prova de fidelidade da
-- reconstrucao.
--
-- Roda dentro de transacao revertida (nada fica gravado).
-- psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

create temp table esperado_col (tab text, col text, tipo text, nn boolean, defe text) on commit drop;
insert into esperado_col values
  ('geo_access_logs','id','uuid',true,'gen_random_uuid()'),
  ('geo_access_logs','user_id','uuid',false,'-'),
  ('geo_access_logs','user_email','text',false,'-'),
  ('geo_access_logs','ip_address','text',true,'-'),
  ('geo_access_logs','country_code','text',false,'-'),
  ('geo_access_logs','country_name','text',false,'-'),
  ('geo_access_logs','city','text',false,'-'),
  ('geo_access_logs','region','text',false,'-'),
  ('geo_access_logs','action','text',true,'-'),
  ('geo_access_logs','reason','text',false,'-'),
  ('geo_access_logs','user_agent','text',false,'-'),
  ('geo_access_logs','created_at','timestamp with time zone',true,'now()'),
  ('geo_restrictions','id','uuid',true,'gen_random_uuid()'),
  ('geo_restrictions','country_code','text',true,'-'),
  ('geo_restrictions','country_name','text',true,'-'),
  ('geo_restrictions','restriction_type','text',true,'-'),
  ('geo_restrictions','reason','text',false,'-'),
  ('geo_restrictions','created_at','timestamp with time zone',true,'now()'),
  ('geo_restrictions','created_by','text',false,'-'),
  ('geo_restrictions','updated_at','timestamp with time zone',true,'now()'),
  ('geo_settings','id','uuid',true,'gen_random_uuid()'),
  ('geo_settings','enabled','boolean',true,'false'),
  ('geo_settings','mode','text',true,'blocklist'),
  ('geo_settings','log_blocked_attempts','boolean',true,'true'),
  ('geo_settings','notify_on_block','boolean',true,'false'),
  ('geo_settings','created_at','timestamp with time zone',true,'now()'),
  ('geo_settings','updated_at','timestamp with time zone',true,'now()');

create temp table esperado_idx (tab text, idx text, metodo text, colunas text, relopts text) on commit drop;
insert into esperado_idx values
  ('geo_access_logs','idx_geo_access_logs_country_code','btree','country_code',''),
  ('geo_access_logs','idx_geo_access_logs_created_at','btree','created_at DESC',''),
  ('geo_access_logs','idx_geo_access_logs_created_brin','brin','created_at','pages_per_range=32'),
  ('geo_restrictions','idx_geo_restrictions_country_code','btree','country_code','');

create temp table esperado_pol (tab text, pol text, cmd text, usando text, checando text) on commit drop;
insert into esperado_pol values
  ('geo_access_logs','Admins can view geo access logs','SELECT','is_admin_or_supervisor',''),
  ('geo_access_logs','Only admins can insert geo access logs','INSERT','','is_admin_or_supervisor'),
  ('geo_access_logs','Admins can delete geo access logs','DELETE','is_admin_or_supervisor',''),
  ('geo_restrictions','Admins can manage geo restrictions','ALL','is_admin_or_supervisor',''),
  ('geo_restrictions','Authenticated users can read geo restrictions','SELECT','auth.uid',''),
  ('geo_settings','Admins can manage geo settings','ALL','is_admin_or_supervisor',''),
  ('geo_settings','Admins supervisors view geo_settings','SELECT','is_admin_or_supervisor','');

-- 1. As tres tabelas existem, com RLS ligada.
do $$
declare t text; falta text[] := '{}';
begin
  foreach t in array array['geo_access_logs','geo_restrictions','geo_settings'] loop
    if to_regclass('public.' || t) is null then
      falta := falta || (t || ':nao existe');
    elsif not (select c.relrowsecurity from pg_class c where c.oid = ('public.' || t)::regclass) then
      falta := falta || (t || ':sem RLS');
    end if;
  end loop;
  if array_length(falta, 1) > 0 then
    raise exception 'FALHA 1: %', array_to_string(falta, ', ');
  end if;
  raise notice '1/7 ok: as tres tabelas geo_* existem com RLS ligada';
end $$;

-- 2. Colunas, tipos, nulidade e default identicos ao snapshot de producao.
do $$
declare r record; falta text[] := '{}';
begin
  for r in select * from esperado_col loop
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      join pg_attribute a on a.attrelid = c.oid and a.attname = r.col and a.attnum > 0 and not a.attisdropped
      left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
      where n.nspname = 'public' and c.relname = r.tab
        and format_type(a.atttypid, a.atttypmod) = r.tipo
        and a.attnotnull = r.nn
        and coalesce(replace(replace(pg_get_expr(d.adbin, d.adrelid), '::text', ''), '''', ''), '-') = r.defe
    ) then
      falta := falta || (r.tab || '.' || r.col);
    end if;
  end loop;
  if array_length(falta, 1) > 0 then
    raise exception 'FALHA 2: coluna(tipo/nulidade/default) divergente ou ausente: %', array_to_string(falta, ', ');
  end if;
  raise notice '2/7 ok: 27 colunas conferidas (nome, tipo, nulidade e default = producao)';
end $$;

-- 3. Nenhuma coluna a mais do que o snapshot (migration nao inventa nem perde coluna).
do $$
declare r record; extra text[] := '{}';
begin
  for r in
    select c.relname as tab, a.attname as col
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
    where n.nspname = 'public'
      and c.relname in ('geo_access_logs','geo_restrictions','geo_settings')
      and not exists (select 1 from esperado_col e where e.tab = c.relname and e.col = a.attname)
  loop
    extra := extra || (r.tab || '.' || r.col);
  end loop;
  if array_length(extra, 1) > 0 then
    raise exception 'FALHA 3: coluna que o snapshot nao preve: %', array_to_string(extra, ', ');
  end if;
  raise notice '3/7 ok: nenhuma coluna extra nas tres tabelas';
end $$;

-- 4. Constraints: PK, UNIQUE e CHECK, com o nome que producao usa.
do $$
declare r record; falta text[] := '{}';
begin
  for r in
    select * from (values
      ('geo_access_logs','geo_access_logs_pkey','PRIMARY KEY'),
      ('geo_access_logs','geo_access_logs_action_check','CHECK'),
      ('geo_restrictions','geo_restrictions_pkey','PRIMARY KEY'),
      ('geo_restrictions','geo_restrictions_country_code_key','UNIQUE'),
      ('geo_restrictions','geo_restrictions_restriction_type_check','CHECK'),
      ('geo_settings','geo_settings_pkey','PRIMARY KEY'),
      ('geo_settings','geo_settings_mode_check','CHECK')
    ) as e(tab, con, tipo)
  loop
    if not exists (
      select 1 from pg_constraint con
      where con.conrelid = ('public.' || r.tab)::regclass and con.conname = r.con and con.contype = (
        case r.tipo when 'PRIMARY KEY' then 'p' when 'UNIQUE' then 'u' else 'c' end)
    ) then
      falta := falta || (r.tab || '.' || r.con);
    end if;
  end loop;
  if array_length(falta, 1) > 0 then
    raise exception 'FALHA 4: constraint ausente: %', array_to_string(falta, ', ');
  end if;
  raise notice '4/7 ok: PK, UNIQUE(country_code) e os CHECK de action/restriction_type/mode presentes';
end $$;

-- 5. Indices, incluindo o BRIN de created_at com pages_per_range=32.
-- pg_get_indexdef escreve USING/WITH em maiuscula: as comparacoes sao case-sensitive.
do $$
declare r record; falta text[] := '{}'; vivo text;
begin
  for r in select * from esperado_idx loop
    if not exists (
      select 1
      from pg_class ic
      join pg_index i on i.indexrelid = ic.oid
      join pg_class c on c.oid = i.indrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_am am on am.oid = ic.relam
      where n.nspname = 'public' and c.relname = r.tab and ic.relname = r.idx
        and am.amname = r.metodo
        and pg_get_indexdef(i.indexrelid) like '%USING ' || r.metodo || ' (' || r.colunas || ')%'
        and (r.relopts = '' or pg_get_indexdef(i.indexrelid) like '%WITH (pages_per_range=''32'')%')
    ) then
      select pg_get_indexdef(i.indexrelid) into vivo
      from pg_class ic join pg_index i on i.indexrelid = ic.oid
      where ic.relname = r.idx;

      falta := falta || (r.tab || '.' || r.idx || ' [' || coalesce(vivo, 'nao existe') || ']');
    end if;
  end loop;
  if array_length(falta, 1) > 0 then
    raise exception 'FALHA 5: indice ausente ou divergente: %', array_to_string(falta, ' | ');
  end if;
  raise notice '5/7 ok: os 4 indices existem com metodo, colunas e opcoes de producao';
end $$;

-- 6. Policies: as mesmas sete, TO authenticated, com o predicado que a migration cria.
do $$
declare r record; falta text[] := '{}'; p record;
begin
  for r in select * from esperado_pol loop
    select p2.cmd, p2.roles::text, coalesce(p2.qual, ''), coalesce(p2.with_check, '') into p
    from pg_policies p2
    where p2.schemaname = 'public' and p2.tablename = r.tab and p2.policyname = r.pol;

    if p is null then
      falta := falta || (r.tab || '.' || r.pol || ':ausente');
    elsif p.cmd <> r.cmd or p.roles <> '{authenticated}' then
      falta := falta || (r.tab || '.' || r.pol || ':cmd/roles');
    elsif r.usando <> '' and p.qual not like '%' || r.usando || '%' then
      falta := falta || (r.tab || '.' || r.pol || ':using');
    elsif r.checando <> '' and p.with_check not like '%' || r.checando || '%' then
      falta := falta || (r.tab || '.' || r.pol || ':with check');
    end if;
  end loop;

  if exists (
    select 1 from pg_policies p3
    where p3.schemaname = 'public'
      and p3.tablename in ('geo_access_logs','geo_restrictions','geo_settings')
      and not exists (select 1 from esperado_pol e where e.tab = p3.tablename and e.pol = p3.policyname)
  ) then
    raise exception 'FALHA 6: existe policy geo_* fora do snapshot de producao';
  end if;

  if array_length(falta, 1) > 0 then
    raise exception 'FALHA 6: %', array_to_string(falta, ', ');
  end if;
  raise notice '6/7 ok: as 7 policies de producao declaradas pela migration existem (TO authenticated, predicado conferido)';
end $$;

-- 7. Triggers de updated_at que a migration recria.
do $$
declare r record; falta text[] := '{}';
begin
  for r in
    select * from (values
      ('geo_restrictions','update_geo_restrictions_updated_at'),
      ('geo_settings','update_geo_settings_updated_at')
    ) as e(tab, trg)
  loop
    if not exists (
      select 1 from pg_trigger t
      where t.tgrelid = ('public.' || r.tab)::regclass and t.tgname = r.trg and not t.tgisinternal
        and pg_get_triggerdef(t.oid) like '%BEFORE UPDATE%'
        and pg_get_triggerdef(t.oid) like '%update_updated_at_column()%'
    ) then
      falta := falta || (r.tab || '.' || r.trg);
    end if;
  end loop;
  if array_length(falta, 1) > 0 then
    raise exception 'FALHA 7: trigger ausente: %', array_to_string(falta, ', ');
  end if;
  raise notice '7/7 ok: os dois gatilhos BEFORE UPDATE chamam update_updated_at_column()';
end $$;

rollback;