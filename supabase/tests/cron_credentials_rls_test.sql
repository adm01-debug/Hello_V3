-- Gate da etapa 040 (achado A-098): cron e funcoes nao podem carregar host nem
-- JWT literal. Um projeto trocado de host deixou varios arquivos apontando para
-- o projeto morto, e um deles embute a chave anon de producao.
--
-- Inventario registrado no log + 4 passos que exigem o estado correto.
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
           (command ~ 'https://[a-z0-9]+\.supabase\.co/functions/v1') as tem_host,
           replace(regexp_replace(command, '\s+', ' ', 'g'), 'Bearer ' || chr(39) || ' || ', 'Bearer <vault> ')
             as resumo
    from cron.job
    order by jobname
  loop
    raise notice 'job: % jwt=% host=%', r.jobname, r.tem_jwt, r.tem_host;
    raise notice 'comando: %', left(r.resumo, 240);
  end loop;
end $$;

-- Inventario: funcoes com URL ou JWT literal no corpo.
do $$
declare r record;
begin
  for r in
    select p.proname,
           (p.prosrc like '%eyJhbGciOi%') as tem_jwt,
           (p.prosrc ~ 'https://[a-z0-9]+\.supabase\.co/functions/v1') as tem_host
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.prosrc like '%eyJhbGciOi%' or p.prosrc ~ 'https://[a-z0-9]+\.supabase\.co/functions/v1')
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

-- 1. Nenhum job do cron com JWT ou host literal.
do $$
declare v_falta text[] := '{}'; r record;
begin
  for r in
    select jobname from cron.job
    where command like '%eyJhbGciOi%'
       or command ~ 'https://[a-z0-9]+\.supabase\.co/functions/v1'
    order by jobname
  loop
    v_falta := v_falta || r.jobname;
  end loop;
  if array_length(v_falta, 1) > 0 then
    raise exception 'FALHA 1: job do cron com host/JWT literal no comando: %', array_to_string(v_falta, ', ');
  end if;
  raise notice 'OK 1: nenhum job do cron carrega host nem JWT literal';
end $$;

-- 2. Nenhuma funcao de public com URL literal de edge function.
do $$
declare v_falta text[] := '{}'; r record;
begin
  for r in
    select p.proname from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosrc ~ 'https://[a-z0-9]+\.supabase\.co/functions/v1'
    order by p.proname
  loop
    v_falta := v_falta || r.proname;
  end loop;
  if array_length(v_falta, 1) > 0 then
    raise exception 'FALHA 2: funcao com host de edge function literal: %', array_to_string(v_falta, ', ');
  end if;
  raise notice 'OK 2: nenhuma funcao monta a URL da edge function a mao';
end $$;

-- 3. Nenhuma funcao de public com JWT literal no corpo.
do $$
declare v_falta text[] := '{}'; r record;
begin
  for r in
    select p.proname from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosrc like '%eyJhbGciOi%'
    order by p.proname
  loop
    v_falta := v_falta || r.proname;
  end loop;
  if array_length(v_falta, 1) > 0 then
    raise exception 'FALHA 3: funcao com JWT literal no corpo: %', array_to_string(v_falta, ', ');
  end if;
  raise notice 'OK 3: nenhuma funcao carrega JWT literal';
end $$;

-- 4. O helper monta a URL a partir do vault (efeito real, sem literal no codigo).
do $$
declare v_url text;
begin
  if to_regprocedure('public.edge_function_url(text)') is null then
    raise exception 'FALHA 4: public.edge_function_url(text) nao existe: o host continua espalhado pelo codigo';
  end if;
  select public.edge_function_url('auto-scorecard') into v_url;
  if v_url !~ '^https://[a-z0-9]+\.supabase\.co/functions/v1/auto-scorecard$' then
    raise exception 'FALHA 4: edge_function_url devolveu valor inesperado: %', coalesce(v_url, 'NULL');
  end if;
  raise notice 'OK 4: edge_function_url monta a URL do vault (%)', v_url;
end $$;

-- 5. Todo job que dispara edge function chama o helper de verdade, e o comando
--    passa por PREPARE (prova de sintaxe sem executar o net.http_post).
do $$
declare v_falta text[] := '{}'; v_quebra text[] := '{}'; r record;
begin
  for r in select jobname, command from cron.job where command like '%net.http_post%' order by jobname loop
    if r.command not like '%url := public.edge_function_url(%' then
      v_falta := v_falta || r.jobname;
      continue;
    end if;
    begin
      execute format('PREPARE %I AS %s', 'gate_' || replace(r.jobname, '-', '_'), r.command);
      execute format('DEALLOCATE %I', 'gate_' || replace(r.jobname, '-', '_'));
    exception when others then
      v_quebra := v_quebra || (r.jobname || ': ' || sqlerrm);
    end;
  end loop;
  if array_length(v_falta, 1) > 0 then
    raise exception 'FALHA 5: job que nao chama o helper na URL (aspas em volta?): %', array_to_string(v_falta, ', ');
  end if;
  if array_length(v_quebra, 1) > 0 then
    raise exception 'FALHA 5: comando do cron nao passa no PREPARE: %', array_to_string(v_quebra, ' | ');
  end if;
  raise notice 'OK 5: todos os jobs de edge function chamam public.edge_function_url e o comando planeja sem erro';
end $$;

rollback;