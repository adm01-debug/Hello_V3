-- Gate da etapa 040 (achado A-098): cron e funcoes nao podem carregar host nem
-- JWT literal. Um projeto trocado de host deixou 7 arquivos apontando para o
-- projeto morto, e um deles embute a chave anon de producao.
--
-- Inventario registrado no log + 2 passos que exigem o estado correto.
-- Roda dentro de transacao revertida (nada fica gravado).
-- psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

-- Inventario: jobs do cron com host ou JWT literal no comando.
do $$
declare r record;
begin
  for r in
    select jobname,
           (command like '%eyJhbGciOi%') as tem_jwt,
           (command ~ 'https://[a-z]+\.supabase\.co/functions/v1') as tem_host,
           substring(command from 'https://([a-z]+)\.supabase\.co/functions/v1(/)') as host
    from cron.job
    order by jobname
  loop
    raise notice 'job: % jwt=% host=%',
      r.jobname, r.tem_jwt, r.tem_host;
  end loop;
end $$;

-- Inventario: funcoes com URL literal ou JWT literal no corpo.
do $$
declare r record;
begin
  for r in
    select p.proname,
           (p.prosrc like '%eyJhbGciOi%') as tem_jwt,
           (p.prosrc ~ 'https://[a-z]+\.supabase\.co/functions/v1') as tem_host
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.prosrc like '%eyJhbGciOi%' or p.prosrc ~ 'https://[a-z]+\.supabase\.co/functions/v1')
    order by p.proname
  loop
    raise notice 'funcao: % jwt=% host=%', r.proname, r.tem_jwt, r.tem_host;
  end loop;
end $$;

-- Inventario: segredos do vault que os crons podem usar (so os nomes).
do $$
declare r record;
begin
  for r in select name from vault.secrets order by name loop
    raise notice 'segredo: %', r.name;
  end loop;
end $$;

-- 1. Nenhum job do cron com JWT literal no comando.
do $$
declare v_falta text[] := '{}'; r record;
begin
  for r in select jobname from cron.job where command like '%eyJhbGciOi%' order by jobname loop
    v_falta := v_falta || r.jobname;
  end loop;
  if array_length(v_falta, 1) > 0 then
    raise exception 'FALHA 1: cron com JWT literal no comando: %', array_to_string(v_falta, ', ');
  end if;
  raise notice 'OK 1: nenhum job do cron carrega JWT literal';
end $$;

-- 2. Nenhuma funcao de public com URL literal de edge function.
do $$
declare v_falta text[] := '{}'; r record;
begin
  for r in
    select p.proname from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosrc ~ 'https://[a-z]+\.supabase\.co/functions/v1'
    order by p.proname
  loop
    v_falta := v_falta || r.proname;
  end loop;
  if array_length(v_falta, 1) > 0 then
    raise exception 'FALHA 2: funcao com host de edge function literal: %', array_to_string(v_falta, ', ');
  end if;
  raise notice 'OK 2: nenhuma funcao monta a URL da edge function a mao';
end $$;

rollback;