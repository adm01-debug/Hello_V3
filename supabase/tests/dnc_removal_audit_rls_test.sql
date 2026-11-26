-- Gate da etapa 175 (A-123, A-025): rastreabilidade da lista DNC.
-- Roda dentro de transacao revertida (migrations.yml modo=verificar).
--   1) as tres colunas de auditoria existem
--   2) o gatilho BEFORE UPDATE existe em dnc_list
--   3) a funcao do gatilho e SECURITY DEFINER, com search_path fixo e sem EXECUTE para authenticated
--   4) supervisor desativa: removed_by / removed_at / removal_reason carimbados
--   5) edicao de motivo, observacao e validade persiste e nao mexe no carimbo
--   6) reativacao limpa o carimbo
--   7) usuario comum le a lista mas nao altera (RLS de verdade, como `authenticated`)
--   8) anon nao altera

begin;

do $$
declare
  v_cols integer;
  v_trg integer;
  v_secdef boolean;
  v_path text;
  v_acl text;
  v_id uuid;
  v_admin uuid;
  v_other uuid;
  v_admin_email text;
  v_rows integer;
  v_rec record;
begin
  -- 1. colunas de auditoria
  select count(*) into v_cols
    from information_schema.columns
   where table_schema = 'public' and table_name = 'dnc_list'
     and column_name in ('removed_by', 'removed_at', 'removal_reason');
  if v_cols <> 3 then
    raise exception 'esperava 3 colunas de auditoria em dnc_list, obteve %', v_cols;
  end if;
  raise notice '1/8 ok: colunas removed_by, removed_at e removal_reason existem';

  -- 2. gatilho
  select count(*) into v_trg
    from pg_trigger t
   where t.tgrelid = 'public.dnc_list'::regclass
     and t.tgname = 'trg_dnc_track_removal'
     and not t.tgisinternal;
  if v_trg <> 1 then
    raise exception 'gatilho trg_dnc_track_removal ausente em dnc_list';
  end if;
  raise notice '2/8 ok: gatilho BEFORE UPDATE presente';

  -- 3. funcao do gatilho
  select p.prosecdef, coalesce(array_to_string(p.proconfig, ','), ''), coalesce(p.proacl::text, '')
    into v_secdef, v_path, v_acl
    from pg_proc p
   where p.oid = 'public.dnc_track_removal()'::regprocedure;
  if v_secdef is not true then
    raise exception 'dnc_track_removal nao e SECURITY DEFINER';
  end if;
  if position('search_path=public' in v_path) = 0 then
    raise exception 'dnc_track_removal sem search_path fixo (proconfig=%)', v_path;
  end if;
  if position('authenticated' in v_acl) > 0 then
    raise exception 'authenticated ainda tem EXECUTE em dnc_track_removal (%)', v_acl;
  end if;
  raise notice '3/8 ok: SECURITY DEFINER, search_path fixo e EXECUTE revogado de authenticated';

  -- linha de teste, criada fora do RLS (runner e superusuario)
  insert into public.dnc_list (phone, phone_normalized, reason, source)
  values ('+55 11 90000 0001', '5511900000001', 'manual', 'gate-175')
  returning id into v_id;

  select ur.user_id into v_admin
    from public.user_roles ur
   where ur.role in ('admin', 'supervisor')
     and coalesce(ur.is_active, true)
     and (ur.expires_at is null or ur.expires_at > now())
   limit 1;
  select up.email into v_admin_email from public.user_profiles up where up.id = v_admin;
  select u.id into v_other
    from auth.users u
   where not exists (
     select 1 from public.user_roles r
      where r.user_id = u.id
        and r.role in ('admin', 'supervisor')
        and coalesce(r.is_active, true)
   )
   limit 1;

  if v_admin is null or v_other is null then
    raise notice '4/8 pulado: faltam papeis para simular (supervisor=%, comum=%)', v_admin, v_other;
    return;
  end if;

  begin
    execute 'set local role authenticated';
  exception when insufficient_privilege then
    raise notice '4/8 pulado: runner nao assume o papel authenticated';
    return;
  end;

  -- 4. supervisor desativa
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'email', v_admin_email)::text, true);
  execute format('update public.dnc_list set is_active = false, removal_reason = %L where id = %L', 'pedido do titular', v_id);
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    execute 'reset role';
    raise exception 'supervisor deveria desativar 1 linha, desativou %', v_rows;
  end if;

  execute format('update public.dnc_list set reason = %L, notes = %L, expires_at = %L where id = %L',
                 'complaint', 'editado no gate', (now() + interval '30 days')::text, v_id);
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    execute 'reset role';
    raise exception 'supervisor deveria editar 1 linha, editou %', v_rows;
  end if;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);

  select * into v_rec from public.dnc_list where id = v_id;
  if v_rec.is_active then
    raise exception 'entrada continua ativa apos a desativacao';
  end if;
  if v_rec.removed_at is null then
    raise exception 'removed_at ficou nulo na desativacao';
  end if;
  if coalesce(v_rec.removed_by, '') = '' then
    raise exception 'removed_by ficou vazio na desativacao';
  end if;
  if v_admin_email is not null and v_rec.removed_by <> v_admin_email then
    raise exception 'removed_by deveria ser % e veio %', v_admin_email, v_rec.removed_by;
  end if;
  if v_rec.removal_reason <> 'pedido do titular' then
    raise exception 'removal_reason deveria ser "pedido do titular" e veio %', v_rec.removal_reason;
  end if;
  raise notice '4/8 ok: desativacao carimba autor (%) e data', v_rec.removed_by;

  -- 5. edicao de motivo/validade
  if v_rec.reason <> 'complaint' then
    raise exception 'reason nao persistiu a edicao (veio %)', v_rec.reason;
  end if;
  if v_rec.notes <> 'editado no gate' then
    raise exception 'notes nao persistiu a edicao (veio %)', v_rec.notes;
  end if;
  if v_rec.expires_at is null then
    raise exception 'expires_at nao persistiu a edicao';
  end if;
  raise notice '5/8 ok: motivo, observacao e validade persistem';

  -- 6. reativacao limpa o carimbo
  begin
    execute 'set local role authenticated';
  exception when insufficient_privilege then
    raise notice '6/8 pulado: runner nao assume o papel authenticated';
    return;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'email', v_admin_email)::text, true);
  execute format('update public.dnc_list set is_active = true where id = %L', v_id);
  get diagnostics v_rows = row_count;

  -- 7. usuario comum nao altera e continua lendo
  perform set_config('request.jwt.claims', json_build_object('sub', v_other)::text, true);
  execute format('update public.dnc_list set is_active = false where id = %L', v_id);
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    execute 'reset role';
    raise exception 'usuario comum alterou % linha(s) da lista DNC', v_rows;
  end if;
  execute 'select count(*) from public.dnc_list' into v_rows;
  if v_rows < 1 then
    execute 'reset role';
    raise exception 'usuario comum deveria continuar lendo a lista e leu 0';
  end if;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);

  select * into v_rec from public.dnc_list where id = v_id;
  if v_rec.is_active is not true then
    raise exception 'reativacao nao chegou ao banco';
  end if;
  if v_rec.removed_at is not null or v_rec.removed_by is not null or v_rec.removal_reason is not null then
    raise exception 'reativacao deveria limpar o carimbo (removed_by=%, removed_at=%, removal_reason=%)',
      v_rec.removed_by, v_rec.removed_at, v_rec.removal_reason;
  end if;
  raise notice '6/8 ok: reativacao limpa o carimbo de remocao';
  raise notice '7/8 ok: usuario comum le a lista e nao altera (sob RLS)';
end $$;

-- 8. anon nao altera
do $$
declare
  v_rows integer;
begin
  if not pg_has_role(current_user, 'anon'::name, 'member') then
    raise notice '8/8 pulado: anon nao e assumivel por %', current_user;
    return;
  end if;
  begin
    execute 'set local role anon';
  exception when insufficient_privilege then
    raise notice '8/8 pulado: sem privilegio para assumir anon';
    return;
  end;
  begin
    execute 'update public.dnc_list set is_active = false';
  exception when insufficient_privilege then
    execute 'reset role';
    raise notice '8/8 ok: anon sem privilegio de escrita na lista DNC';
    return;
  end;
  get diagnostics v_rows = row_count;
  execute 'reset role';
  if v_rows > 0 then
    raise exception 'anon alterou % linha(s) da lista DNC', v_rows;
  end if;
  raise notice '8/8 ok: anon nao altera a lista DNC';
end $$;

rollback;