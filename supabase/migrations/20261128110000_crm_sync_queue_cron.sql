-- Etapa 083 (achados A-066, A-080): a fila de sincronizacao do CRM nunca teve
-- quem a consumisse. `supabase/functions/sync-crm-queue/index.ts` e a unica
-- processadora da fila e nada a agendava: o item enfileirado ficava em 'pending'
-- para sempre (a tabela nasceu em 20260507220616 sem nenhum job e
-- `grep -rn "sync-crm-queue"` fora do proprio diretorio nao retornava nada).
--
-- Desenho: job pg_cron de 5 em 5 minutos disparando a edge por net.http_post.
-- A edge continua aceitando sessao de usuario (o botao "Processar fila agora"
-- na tela de integracao usa esse caminho) e passa a aceitar o token opaco do
-- cron conferido NO BANCO.
--
-- POR QUE O TOKEN NAO VEM DE ENV VAR DA EDGE (diferente dos 5 crons de 2026-11-22):
-- aqueles guardam o mesmo segredo em dois lugares (Vault + env var da edge) e o
-- par fora de sincronia deixa o cron em 401 silencioso -- foi assim que a purga
-- de optimistic_lock_conflicts ficou anos parada (supabase/config.toml:1-8).
-- Aqui o segredo mora SO no Vault: o job manda `Bearer <crm_sync_cron_token>` e
-- a edge pergunta a public.token_cron_valido() se aquele valor vale, usando a
-- service_role que ela ja tem. Rotacionar = vault.update_secret, sem redeploy.
--
-- Requer [functions.sync-crm-queue] verify_jwt = false em supabase/config.toml,
-- senao o gateway recusa o bearer opaco ANTES da edge rodar.
--
-- Idempotente: nao sobrescreve segredo existente nem duplica o job.
-- Reverter: SELECT cron.unschedule('crm-sync-queue');
--           DROP FUNCTION public.token_cron_valido(text, text);

DO $guard$
DECLARE v_token uuid;
BEGIN
  IF to_regclass('public.crm_sync_queue') IS NULL THEN
    RAISE EXCEPTION 'crm_sync_queue ausente: aplique a DDL da fila antes de agendar o consumo dela';
  END IF;

  SELECT id INTO v_token FROM vault.secrets WHERE name = 'crm_sync_cron_token';
  IF v_token IS NULL THEN
    PERFORM vault.create_secret(
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
      'crm_sync_cron_token',
      'Token do job de 5 min que processa public.crm_sync_queue pela edge sync-crm-queue'
    );
    RAISE NOTICE 'segredo crm_sync_cron_token criado';
  ELSE
    RAISE NOTICE 'segredo crm_sync_cron_token ja existia: mantido (o job continua valido)';
  END IF;
END
$guard$;

-- Conferencia do bearer do cron. Quem chama e a edge (service_role); o valor do
-- segredo nunca sai do Vault, so a resposta booleana.
CREATE OR REPLACE FUNCTION public.token_cron_valido(p_nome text, p_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p_token IS NOT NULL
     AND length(p_token) >= 32
     AND EXISTS (
           SELECT 1
             FROM vault.decrypted_secrets s
            WHERE s.name = p_nome
              AND s.decrypted_secret = p_token
         );
$$;

REVOKE ALL ON FUNCTION public.token_cron_valido(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.token_cron_valido(text, text) TO postgres, service_role;

SELECT cron.unschedule('crm-sync-queue')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'crm-sync-queue');

SELECT cron.schedule(
  'crm-sync-queue',
  '*/5 * * * *',
  $job$
  SELECT net.http_post(
    url := public.edge_function_url('sync-crm-queue'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'crm_sync_cron_token'
      )
    ),
    body := jsonb_build_object('trigger', 'cron', 'limit', 50)
  );
  $job$
);