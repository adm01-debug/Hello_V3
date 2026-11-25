-- Indices de auditoria, busca de contatos e views de diagnostico.
--
-- Substitui 20250102000000_performance_indexes.sql, que usava a MESMA versao de
-- 20250102000000_hello_production.sql e por isso nunca entrava no historico de
-- migrations aplicadas (public.schema_migrations tem PK em version).
--
-- O que os 26 blocos do arquivo antigo produzem, lido direto do banco de producao
-- em 2026-11-25 (run 45619828581 do workflow migrations.yml, modo verificar):
--   - 10 blocos miravam as tabelas calls, transcriptions e users: nao existem
--     (os nomes atuais sao call_sessions, call_transcriptions e user_profiles);
--   - 2 blocos de contacts exigiam contacts.user_id: a coluna nao existe;
--   - 2 blocos de audit_logs exigiam severity e success: as colunas nao existem;
--   - ja existem no banco: idx_contacts_phone, idx_contacts_email,
--     idx_contacts_name_search, idx_audit_user_timestamp, idx_audit_action_timestamp
--     e as views index_usage / unused_indexes;
--   - idx_audit_user_timestamp e duplicata exata de idx_audit_logs_user_date (mesmas
--     colunas, mesmo tipo), entao foi retirado daqui: o que falta e remover, nao criar;
--   - idx_contacts_name_search e to_tsvector('english', name), que nao atende a busca
--     real da tela: src/hooks/useContacts.ts:91 usa name.ilike / phone.ilike /
--     company.ilike. Dai o indice trigram abaixo.
-- O unico objeto que este arquivo cria de fato hoje e idx_contacts_name_trgm
-- (contacts tem 101 linhas e audit_logs 339: custo de criacao desprezivel).
--
-- Os blocos removidos continuam no historico do git.
-- Sem BEGIN/COMMIT explicito: quem controla a transacao e o psql do workflow
-- (--single-transaction ao aplicar, begin/rollback no dry-run).

CREATE EXTENSION IF NOT EXISTS pg_trgm

-- Busca de contatos por nome (ILIKE '%termo%') -> indice trigram, nao tsvector.
DO $$
BEGIN
    IF to_regclass('public.contacts') IS NOT NULL THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm
ON contacts USING gin (name gin_trgm_ops);$stmt$;
    END IF;
END $$

-- Trilha de auditoria filtrada por acao e ordenada por data.
DO $$
BEGIN
    IF to_regclass('public.audit_logs') IS NOT NULL THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_audit_action_timestamp
ON audit_logs (action, created_at DESC);$stmt$;
    END IF;
END $$

-- Views de diagnostico usadas em docs/estado/dados-schema-migrations.md.
CREATE OR REPLACE VIEW index_usage AS
SELECT
  schemaname,
  relname AS tablename,
  indexrelname AS indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC

CREATE OR REPLACE VIEW unused_indexes AS
SELECT
  schemaname,
  relname AS tablename,
  indexrelname AS indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE 'pk_%'
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC

-- Manutencao: SELECT * FROM index_usage; / SELECT * FROM unused_indexes;
