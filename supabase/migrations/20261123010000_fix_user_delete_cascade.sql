-- Corrige exclusão de conta: 8 FKs para auth.users em NO ACTION bloqueavam
-- DELETE em qualquer usuário (PostgREST erro 23503 -> 500). Todas as colunas
-- são nullable e guardam log/métrica/autoria, então SET NULL preserva o
-- histórico e permite excluir a conta (LGPD).
BEGIN;

ALTER TABLE public.rate_limit_logs      DROP CONSTRAINT IF EXISTS rate_limit_logs_user_id_fkey,
                                        ADD CONSTRAINT rate_limit_logs_user_id_fkey
                                        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.performance_metrics  DROP CONSTRAINT IF EXISTS performance_metrics_user_id_fkey,
                                        ADD CONSTRAINT performance_metrics_user_id_fkey
                                        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.rate_limit_alerts    DROP CONSTRAINT IF EXISTS rate_limit_alerts_user_id_fkey,
                                        ADD CONSTRAINT rate_limit_alerts_user_id_fkey
                                        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.rate_limit_alerts    DROP CONSTRAINT IF EXISTS rate_limit_alerts_resolved_by_fkey,
                                        ADD CONSTRAINT rate_limit_alerts_resolved_by_fkey
                                        FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.kb_article_history   DROP CONSTRAINT IF EXISTS kb_article_history_changed_by_fkey,
                                        ADD CONSTRAINT kb_article_history_changed_by_fkey
                                        FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.entity_versions      DROP CONSTRAINT IF EXISTS entity_versions_changed_by_fkey,
                                        ADD CONSTRAINT entity_versions_changed_by_fkey
                                        FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.user_roles           DROP CONSTRAINT IF EXISTS user_roles_granted_by_fkey,
                                        ADD CONSTRAINT user_roles_granted_by_fkey
                                        FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

COMMIT;
