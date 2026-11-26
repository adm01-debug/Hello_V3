# Lints de segurança e performance

Verificações objetivas feitas no catálogo. Um agente deve ler isto antes de propor mudanças em RLS, functions ou índices.

| severidade | código | objeto | detalhe |
|---|---|---|---|
| ALTA | view_security_definer | public.index_usage | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.unused_indexes | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| MÉDIA | rls_no_policies | public.migration_rollbacks | RLS ligado sem policies: inacessível via API (só service_role). |
| MÉDIA | rls_no_policies | public.schema_migrations | RLS ligado sem policies: inacessível via API (só service_role). |
| BAIXA | extension_in_public | dblink | Extensão instalada no schema public (recomendado: schema extensions). |
| BAIXA | extension_in_public | pg_trgm | Extensão instalada no schema public (recomendado: schema extensions). |
| BAIXA | extension_in_public | vector | Extensão instalada no schema public (recomendado: schema extensions). |
| BAIXA | fk_without_index | public.bitrix_departments.bitrix_departments_parent_id_fkey | FK sem índice nas colunas ['parent_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.cadence_step_runs.cadence_step_runs_cadence_id_fkey | FK sem índice nas colunas ['cadence_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.cadence_step_runs.cadence_step_runs_step_id_fkey | FK sem índice nas colunas ['step_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.call_park_orbits.call_park_orbits_moh_prompt_id_fkey | FK sem índice nas colunas ['moh_prompt_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.call_scorecards.call_scorecards_reviewer_id_fkey | FK sem índice nas colunas ['reviewer_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.client_errors.client_errors_resolved_by_fkey | FK sem índice nas colunas ['resolved_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.client_errors.client_errors_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.coaching_assignments.coaching_assignments_scorecard_id_fkey | FK sem índice nas colunas ['scorecard_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.entity_versions.entity_versions_changed_by_fkey | FK sem índice nas colunas ['changed_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.parked_calls.parked_calls_retrieved_by_fkey | FK sem índice nas colunas ['retrieved_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_preferences.Users can insert own preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_preferences.Users can update own preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_preferences.Users can view own preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
