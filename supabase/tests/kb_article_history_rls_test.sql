-- Gate do achado A-142: a base de conhecimento grava uma versao por alteracao de
-- artigo (trigger kb_article_history_trigger -> handle_kb_article_history), e
-- ate agora nao havia nenhuma tela lendo kb_article_history.
--
-- A tela nova (ArticleHistoryCard dentro do dialogo de leitura do artigo em
-- /knowledge) le a tabela como o usuario logado. Este gate prova em producao:
--   1) RLS ligado;
--   2) nenhuma policy de escrita (so o trigger grava);
--   3) toda policy de leitura passa por is_admin_or_supervisor();
--   4) trigger ativo em INSERT/UPDATE apontando para a funcao certa;
--   5) funcao SECURITY DEFINER com search_path fixo (e o que deixa o INSERT do
--      trigger passar pela RLS sem policy de INSERT);
--   6) a condicao da policy e verdadeira para admin ativo e falsa para quem nao
--      tem papel de admin/supervisor;
--   7) anon nao le;
--   8) criar+editar um artigo grava as versoes (prova funcional do trigger).
--
-- Roda dentro de transacao revertida no fim (nada fica gravado no banco).
-- Rodar com: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

-- 1. RLS habilitado na tabela
do $$
declare v_rls boolean; v_rows bigint;
begin
  select relrowsecurity into v_rls from pg_class where oid = 'public.kb_article_history'::regclass;
  if v_rls is not true then
    raise exception 'RLS desligado em public.kb_article_history';
  end if;
  select count(*) into v_rows from public.kb_article_history;
  raise notice '1/8 ok: RLS ligado; versoes ja gravadas = %', v_rows;
end $$;

-- 2. Nenhuma policy de escrita: historico so entra pelo trigger
do $$
declare v_write integer;
begin
  select count(*) into v_write
    from pg_policies
   where schemaname = 'public'
     and tablename = 'kb_article_history'
     and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL');
  if v_write > 0 then
    raise exception 'kb_article_history tem % policy(s) de escrita; o historico deve ser imutavel', v_write;
  end if;
  raise notice '2/8 ok: nenhuma policy de escrita';
end $$;

-- 3. Toda policy de leitura exige admin/supervisor
do $$
declare
  v_total integer;
  r record;
begin
  select count(*) into v_total
    from pg_policies
   where schemaname = 'public' and tablename = 'kb_article_history';
  if v_total = 0 then
    raise exception 'kb_article_history sem policy de leitura: ningem consegue ver o historico';
  end if;

  for r in
    select policyname, coalesce(qual, '') as qual
      from pg_policies
     where schemaname = 'public' and tablename = 'kb_article_history'
  loop
    if position('is_admin_or_supervisor' in r.qual) = 0 then
      raise exception 'policy % nao passa por is_admin_or_supervisor: %', r.policyname, r.qual;
    end if;
  end loop;

  raise notice '3/8 ok: % policy(s) de leitura restritas a admin/supervisor', v_total;
end $$;

-- 4. Trigger ativo em INSERT/UPDATE apontando para handle_kb_article_history
do $$
declare
  v_tgtype smallint;
  v_enabled "char";
  v_proc oid;
begin
  select t.tgtype, t.tgenabled, t.tgfoid
    into v_tgtype, v_enabled, v_proc
    from pg_trigger t
   where t.tgrelid = 'public.kb_articles'::regclass
     and t.tgname = 'kb_article_history_trigger';

  if v_proc is null then
    raise exception 'trigger kb_article_history_trigger ausente em public.kb_articles';
  end if;
  if v_enabled <> 'O' then
    raise exception 'trigger kb_article_history_trigger desativado (tgenabled=%)', v_enabled;
  end if;
  if v_tgtype & 2 <> 0 then
    raise exception 'trigger deveria ser AFTER (tgtype=%)', v_tgtype;
  end if;
  if v_tgtype & 4 = 0 or v_tgtype & 16 = 0 then
    raise exception 'trigger nao cobre INSERT e UPDATE (tgtype=%)', v_tgtype;
  end if;
  if v_proc <> 'public.handle_kb_article_history()'::regprocedure then
    raise exception 'trigger aponta para % em vez de handle_kb_article_history', v_proc::regprocedure;
  end if;

  raise notice '4/8 ok: trigger AFTER INSERT/UPDATE ativo';
end $$;

-- 5. Funcao do trigger roda como dono (SECURITY DEFINER) com search_path fixo
do $$
declare v_definer boolean; v_config text[];
begin
  select p.prosecdef, p.proconfig
    into v_definer, v_config
    from pg_proc p
   where p.oid = 'public.handle_kb_article_history()'::regprocedure;

  if v_definer is not true then
    raise exception 'handle_kb_article_history nao e SECURITY DEFINER: o INSERT no historico cairia na RLS sem policy de escrita e salvar artigo falharia';
  end if;
  if v_config is null or not exists (
    select 1 from unnest(v_config) c where c like 'search_path=%'
  ) then
    raise exception 'handle_kb_article_history sem search_path fixo';
  end if;

  raise notice '5/8 ok: SECURITY DEFINER com search_path fixo';
end $$;

-- 6. A condicao da policy separa admin/supervisor de usuario comum
do $$
declare
  v_admin uuid;
  v_other uuid;
begin
  select user_id into v_admin
    from public.user_roles
   where role in ('admin', 'supervisor')
     and coalesce(is_active, true)
     and (expires_at is null or expires_at > now())
   limit 1;

  if v_admin is null then
    raise notice '6/8 pulado: nenhum admin/supervisor ativo para simular';
    return;
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin)::text, true);
  if coalesce(public.is_admin_or_supervisor(), false) is not true then
    raise exception 'admin ativo % nao passou em is_admin_or_supervisor()', v_admin;
  end if;

  select u.id into v_other
    from auth.users u
   where not exists (
     select 1 from public.user_roles r
      where r.user_id = u.id
        and r.role in ('admin', 'supervisor')
        and coalesce(r.is_active, true)
   )
   limit 1;

  if v_other is null then
    raise notice '6/8 parcial: admin ok; nenhum usuario comum para simular';
    return;
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_other)::text, true);
  if coalesce(public.is_admin_or_supervisor(), false) then
    raise exception 'usuario sem papel admin/supervisor (%) passou na policy do historico', v_other;
  end if;

  perform set_config('request.jwt.claims', '', true);
  raise notice '6/8 ok: admin ve, usuario comum nao ve';
end $$;

-- 7. anon nao le o historico
do $$
declare
  v_role text := 'anon';
  v_cnt bigint;
begin
  if not pg_has_role(current_user, v_role::name, 'member') then
    raise notice '7/8 pulado: % nao e assumivel por %', v_role, current_user;
    return;
  end if;

  execute format('set local role %I', v_role);
  begin
    execute 'select count(*) from public.kb_article_history' into v_cnt;
    reset role;
    if v_cnt > 0 then
      raise exception 'anon leu % linha(s) de kb_article_history', v_cnt;
    end if;
    raise notice '7/8 ok: anon nao ve linhas';
  exception
    when insufficient_privilege then
      reset role;
      raise notice '7/8 ok: anon sem privilegio de leitura';
  end;
end $$;

-- 8. Prova funcional: o mesmo caminho do upsert da tela grava a versao
do $$
declare
  v_article uuid;
  v_versions integer;
  v_types text[];
begin
  insert into public.kb_articles (title, slug, content, status)
  values ('Gate A-142', 'gate-a-142-' || substr(gen_random_uuid()::text, 1, 8), 'conteudo v1', 'draft')
  returning id into v_article;

  update public.kb_articles
     set content = 'conteudo v2', status = 'published'
   where id = v_article;

  select count(*), array_agg(change_type)
    into v_versions, v_types
    from public.kb_article_history
   where article_id = v_article;

  if v_versions <> 2 then
    raise exception 'trigger gravou % versao(oes); esperado 2 (create + status_change)', v_versions;
  end if;
  if not (v_types @> array['create', 'status_change']) then
    raise exception 'tipos gravados inesperados: %', v_types;
  end if;

  raise notice '8/8 ok: criar+editar gerou % versoes (%)', v_versions, v_types;
end $$;
rollback;