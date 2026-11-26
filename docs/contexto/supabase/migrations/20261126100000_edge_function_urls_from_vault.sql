-- Etapa 040 (achado A-098): tira o host e a chave anon de dentro do cron e das
-- funcoes. Um projeto trocado de host deixou 7 arquivos apontando para o projeto
-- morto dyibdjwuoibwwpidgsxu, e o trigger de auto-scorecard ainda carrega a
-- chave anon de producao literal no corpo.
--
-- Padrao (o mesmo do 20261122180000_data_lake_flush_cron_token): o dado mora no
-- Vault e e lido em tempo de execucao. Aqui a URL base vira o segredo
-- 'edge_functions_base_url' e o token do scorecard vira 'auto_scorecard_token'.
-- Para trocar de projeto, basta:
--   select vault.update_secret((select id from vault.secrets
--     where name='edge_functions_base_url'), 'https://<novo-ref>.supabase.co/functions/v1');
-- sem editar migration e sem redeploy.
--
-- Importante: esta migration NAO troca de credencial. O valor de
-- 'auto_scorecard_token' e extraido do corpo que ja esta gravado no banco, entao
-- o comportamento do trigger continua byte a byte identico (a edge
-- auto-scorecard ainda recebe o mesmo Bearer). Trocar por token dedicado exige
-- mudar a edge function e vai na etapa 006.
--
-- Idempotente: nao sobrescreve segredo existente e reusa o schedule atual de
-- cada job.

-- 1. URL base do projeto no Vault, derivada do que ja esta gravado no banco.
DO $guard$
DECLARE v_base text;
BEGIN
  IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'edge_functions_base_url') THEN
    RETURN;
  END IF;

  SELECT substring(command from 'https://[a-z0-9]+\.supabase\.co/functions/v1')
    INTO v_base
    FROM cron.job
   WHERE command ~ 'https://[a-z0-9]+\.supabase\.co/functions/v1'
   ORDER BY jobname
   LIMIT 1;

  IF v_base IS NULL THEN
    SELECT substring(p.prosrc from 'https://[a-z0-9]+\.supabase\.co/functions/v1')
      INTO v_base
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prosrc ~ 'https://[a-z0-9]+\.supabase\.co/functions/v1'
     ORDER BY p.proname
     LIMIT 1;
  END IF;

  IF v_base IS NULL THEN
    RAISE EXCEPTION 'nao consegui derivar a URL base: crie o segredo edge_functions_base_url no Vault';
  END IF;

  PERFORM vault.create_secret(
    v_base,
    'edge_functions_base_url',
    'Base das edge functions, usada por public.edge_function_url(slug)'
  );
  RAISE NOTICE 'segredo edge_functions_base_url criado a partir do banco';
END
$guard$

-- 2. Token do trigger de auto-scorecard: mesmo valor que ja esta no banco.
DO $guard$
DECLARE v_key text;
BEGIN
  IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'auto_scorecard_token') THEN
    RETURN;
  END IF;

  SELECT substring(p.prosrc from 'eyJ[A-Za-z0-9_.-]+')
    INTO v_key
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname = 'trigger_auto_scorecard'
     AND p.prosrc LIKE '%eyJ%';

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'trigger_auto_scorecard nao tem mais a chave embutida e auto_scorecard_token nao existe: crie o segredo antes de aplicar';
  END IF;

  PERFORM vault.create_secret(
    v_key,
    'auto_scorecard_token',
    'Bearer usado pelo trigger_auto_scorecard ao chamar a edge auto-scorecard'
  );
  RAISE NOTICE 'segredo auto_scorecard_token criado a partir do corpo da funcao';
END
$guard$

-- 3. Helper unico que monta a URL de qualquer edge function.
CREATE OR REPLACE FUNCTION public.edge_function_url(p_slug text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_base text;
BEGIN
  SELECT decrypted_secret INTO v_base
    FROM vault.decrypted_secrets
   WHERE name = 'edge_functions_base_url';

  IF v_base IS NULL OR v_base = '' THEN
    RAISE EXCEPTION 'segredo edge_functions_base_url ausente no Vault';
  END IF;

  RETURN rtrim(v_base, '/') || '/' || ltrim(p_slug, '/');
END;
$$

REVOKE ALL ON FUNCTION public.edge_function_url(text) FROM PUBLIC, anon, authenticated

GRANT EXECUTE ON FUNCTION public.edge_function_url(text) TO postgres, service_role

-- 4. Trigger de auto-scorecard sem host nem JWT no corpo.
CREATE OR REPLACE FUNCTION public.trigger_auto_scorecard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_key text;
BEGIN
  IF NEW.summary IS NULL OR length(NEW.summary) < 20 THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
   WHERE name = 'auto_scorecard_token';

  IF v_key IS NULL OR v_key = '' THEN
    RAISE WARNING 'auto-scorecard: segredo auto_scorecard_token ausente, enfileiramento ignorado';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := public.edge_function_url('auto-scorecard'),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object('call_session_id', NEW.call_session_id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto-scorecard enqueue failed: %', SQLERRM;
  RETURN NEW;
END;
$$

-- 5. Reagenda cada job de edge function substituindo a URL literal pelo helper.
--    O schedule, os headers, o body e o timeout vem do proprio job, entao nada
--    alem da URL muda.
DO $guard$
DECLARE r record; v_new text;
BEGIN
  FOR r IN
    SELECT jobname, schedule, command
      FROM cron.job
     WHERE command ~ 'https://[a-z0-9]+\.supabase\.co/functions/v1'
     ORDER BY jobname
  LOOP
    v_new := regexp_replace(
      r.command,
      'https://[a-z0-9]+\.supabase\.co/functions/v1/([a-z0-9-]+)',
      'public.edge_function_url(''\1'')',
      'g'
    );
    PERFORM cron.schedule(r.jobname, r.schedule, v_new);
    RAISE NOTICE 'job % reagendado para usar edge_function_url', r.jobname;
  END LOOP;
END
$guard$
