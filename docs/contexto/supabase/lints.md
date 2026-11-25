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
| BAIXA | fk_without_index | public.call_park_orbits.call_park_orbits_moh_prompt_id_fkey | FK sem índice nas colunas ['moh_prompt_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.entity_versions.entity_versions_changed_by_fkey | FK sem índice nas colunas ['changed_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.parked_calls.parked_calls_retrieved_by_fkey | FK sem índice nas colunas ['retrieved_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_preferences.Users can insert own preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_preferences.Users can update own preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_preferences.Users can view own preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| INFO | rpc_anon_executable | public.can_access_agent_data(target_agent_name text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.check_login_lockout(p_email text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.get_user_agent_id() | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.get_user_agent_name() | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.get_user_role() | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.is_active_agent(_agent_name text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.is_admin() | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.is_admin_or_supervisor() | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.is_supervisor() | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.record_failed_login(p_email text, p_ip_address text, p_user_agent text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.record_successful_login(p_email text, p_ip_address text, p_user_agent text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
