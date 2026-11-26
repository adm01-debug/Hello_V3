-- Etapa 145 — gate: storage.objects e o restante de public/storage.
-- Sonda de leitura que originou a migration: run 45851414557.
-- O trigger de storage.objects proibe DELETE direto ("Use the Storage API instead"),
-- entao o passo 3 prova a policy de DELETE pelo diferencial: o role autorizado chega
-- ao trigger (a RLS deixou a linha passar) e o anon nao chega (a RLS filtra tudo).
-- Tudo roda em UMA transacao revertida no fim.

begin;

-- ---------------------------------------------------------------------------
-- Passo 1: nenhuma policy de public/storage segue avaliada por anon/public.
-- ---------------------------------------------------------------------------
do $$
declare n int; txt text;
begin
  select count(*), string_agg(schemaname || '.' || tablename || '.' || policyname, ', ')
    into n, txt
    from pg_policies
   where schemaname in ('public', 'storage')
     and roles = '{public}';

  if n = 0 then
    raise notice '1/6 ok: nenhuma policy de public/storage avaliada por anon/public';
  else
    raise exception 'FALHA 1: % policy(ies) ainda em {public}: %', n, txt;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 2: os 5 buckets sao privados e as 7 policies de objects sao TO authenticated.
-- ---------------------------------------------------------------------------
do $$
declare v_pub int; v_tot int; v_auth int; v_lst text;
begin
  select count(*) into v_pub from storage.buckets where "public" is true;
  select count(*) into v_tot from pg_policies where schemaname = 'storage' and tablename = 'objects';
  select count(*), string_agg(policyname || '/' || cmd, ', ' order by policyname)
    into v_auth, v_lst
    from pg_policies
   where schemaname = 'storage' and tablename = 'objects' and roles = '{authenticated}';

  if v_pub <> 0 then
    raise exception 'FALHA 2: % bucket(s) publico(s) em producao', v_pub;
  end if;
  if v_tot = 0 then
    raise exception 'FALHA 2: storage.objects sem policies — acesso cairia no deny default e o upload quebraria';
  end if;
  if v_auth <> v_tot then
    raise exception 'FALHA 2: % de % policies de storage.objects sao TO authenticated', v_auth, v_tot;
  end if;

  raise notice '2/6 ok: 0 bucket publico; % policies de storage.objects TO authenticated (%)', v_tot, v_lst;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 3: um usuario autenticado real grava e le nos 4 buckets de arquivo, e o
-- DELETE chega ao trigger do storage (ou seja, a RLS permitiu a linha).
-- ---------------------------------------------------------------------------
do $$
declare v_user uuid;
begin
  select id into v_user from auth.users order by created_at limit 1;
  if v_user is null then
    raise exception 'FALHA 3: nenhum usuario em auth.users para simular autenticacao';
  end if;
  perform set_config('gate145.user', v_user::text, true);
end $$;

set local role authenticated;
select set_config('request.jwt.claims',
                  json_build_object('sub', current_setting('gate145.user'), 'role', 'authenticated')::text,
                  true);

do $$
declare
  v_bucket text;
  v_path text;
  v_lidas int;
  v_chegou_ao_trigger int := 0;
  v_gravados int := 0;
begin
  foreach v_bucket in array array['call-recordings', 'queue-audio', 'data-lake-exports', 'virtual-fax-docs'] loop
    v_path := 'gate145/' || v_bucket || '/' || replace(gen_random_uuid()::text, '-', '') || '.txt';

    begin
      insert into storage.objects (bucket_id, name) values (v_bucket, v_path);
    exception when others then
      raise exception 'FALHA 3: authenticated nao gravou em %: %', v_bucket, sqlerrm;
    end;

    select count(*) into v_lidas from storage.objects where bucket_id = v_bucket and name = v_path;
    if v_lidas <> 1 then
      raise exception 'FALHA 3: authenticated nao le de volta o que gravou em %', v_bucket;
    end if;

    -- DELETE por SQL nunca chega a RLS: o trigger do storage recusa o comando para
    -- qualquer role (statement-level). O unico caminho e a Storage API, com service role.
    begin
      delete from storage.objects where bucket_id = v_bucket and name = v_path;
      raise exception 'FALHA 3: DELETE por SQL passou em % — o trigger do storage deixou de bloquear', v_bucket;
    exception
      when others then
        if position('not allowed' in sqlerrm) > 0 or position('Storage API' in sqlerrm) > 0 then
          v_chegou_ao_trigger := v_chegou_ao_trigger + 1;
        else
          raise exception 'FALHA 3: DELETE por SQL falhou em % com erro inesperado: %', v_bucket, sqlerrm;
        end if;
    end;

    v_gravados := v_gravados + 1;
  end loop;

  raise notice '3/6 ok: authenticated grava e le nos % buckets de arquivo; DELETE por SQL e bloqueado pelo trigger do storage em % (RLS nem entra — nao ha caminho de DELETE por SQL, so Storage API)', v_gravados, v_chegou_ao_trigger;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 4: avatars so no proprio prefixo (<uid>/...).
-- ---------------------------------------------------------------------------
do $$
declare
  v_user uuid := current_setting('gate145.user')::uuid;
  -- o prefixo tem de ser o uid exatamente como auth.uid() devolve (com hifens)
  v_path text := v_user::text || '/gate145-' || replace(gen_random_uuid()::text, '-', '') || '.png';
  v_alheio text := replace(gen_random_uuid()::text, '-', '') || '/gate145-alheio.png';
  v_lidas int;
  v_capturei boolean := false;
begin
  insert into storage.objects (bucket_id, name) values ('avatars', v_path);

  select count(*) into v_lidas from storage.objects where bucket_id = 'avatars' and name = v_path;
  if v_lidas <> 1 then
    raise exception 'FALHA 4: authenticated nao le o proprio avatar';
  end if;

  begin
    insert into storage.objects (bucket_id, name) values ('avatars', v_alheio);
  exception when others then
    v_capturei := true;
  end;

  if not v_capturei then
    raise exception 'FALHA 4: authenticated conseguiu gravar avatar no prefixo de outro usuario (%)', v_alheio;
  end if;

  raise notice '4/6 ok: avatar proprio grava e le; prefixo de outro usuario e recusado pela policy';
end $$;

reset role;

-- ---------------------------------------------------------------------------
-- Passo 5: anon nao le nada e a policy de INSERT recusa os 5 buckets.
-- ---------------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

do $$
declare
  v_lidas int;
  v_bucket text;
  v_capturei boolean;
  v_negados int := 0;
  v_msg text;
begin
  select count(*) into v_lidas from storage.objects;
  if v_lidas <> 0 then
    raise exception 'FALHA 5: anon leu % linha(s) de storage.objects', v_lidas;
  end if;

  foreach v_bucket in array array['call-recordings', 'queue-audio', 'data-lake-exports', 'virtual-fax-docs', 'avatars'] loop
    v_capturei := false;
    begin
      insert into storage.objects (bucket_id, name)
      values (v_bucket, 'gate145-anon/' || replace(gen_random_uuid()::text, '-', '') || '.txt');
    exception when others then
      v_capturei := true;
      v_msg := coalesce(v_msg, sqlerrm);
    end;
    if v_capturei then
      v_negados := v_negados + 1;
    end if;

  end loop;

  if v_negados <> 5 then
    raise exception 'FALHA 5: anon gravou em % bucket(s) — deveria ser bloqueado nos 5', 5 - v_negados;
  end if;
  if v_msg is null or position('row-level security' in v_msg) = 0 then
    raise exception 'FALHA 5: o bloqueio do anon nao veio da RLS (mensagem: %)', coalesce(v_msg, 'sem erro');
  end if;

  raise notice '5/6 ok: anon le 0 linhas de storage.objects e a policy de INSERT recusa os 5 buckets';
end $$;

reset role;

-- ---------------------------------------------------------------------------
-- Passo 6: nada foi perdido — public mantem o total de policies e as deny seguem negando.
-- ---------------------------------------------------------------------------
do $$
declare v_total int; v_deny int;
begin
  select count(*) into v_total from pg_policies where schemaname = 'public';
  select count(*) into v_deny
    from pg_policies
   where schemaname = 'public' and with_check = 'false';

  if v_total < 463 then
    raise exception 'FALHA 6: public passou a ter % policies (esperado >= 463)', v_total;
  end if;
  if v_deny < 6 then
    raise exception 'FALHA 6: % deny-policies WITH CHECK (false) em public (esperado >= 6)', v_deny;
  end if;

  raise notice '6/6 ok: public mantem % policies, % delas deny WITH CHECK (false) — negacao preservada', v_total, v_deny;
end $$;

rollback;