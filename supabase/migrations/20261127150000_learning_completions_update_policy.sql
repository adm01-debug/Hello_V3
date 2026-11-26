-- Etapa 087 (achado A-067) -- policy de UPDATE para public.learning_completions.
--
-- A tabela foi criada em 20260417000338_...sql:175-177 com SELECT, INSERT e DELETE,
-- mas sem UPDATE. src/hooks/useLearning.ts:54-58 faz
--   .upsert({agent_name, module_id, score}, {onConflict: 'agent_name,module_id'})
-- e o Postgres resolve isso como INSERT ... ON CONFLICT DO UPDATE -- que exige policy
-- de UPDATE. Sem ela, a linha existente nunca e atualizada: o agente refaz o modulo com
-- nota melhor, ve "Modulo concluido!" (:63) e a nota antiga permanece.
--
-- Predicado: o agente atualiza apenas a propria conclusao -- o mesmo criterio das
-- policies de SELECT e INSERT da tabela (`get_user_agent_name()`, STABLE e SECURITY
-- DEFINER, definida em 20251225183119_...sql:13-21). `WITH CHECK` impede tambem que a
-- linha seja reapontada para outro agente pelo proprio agente.
-- `DROP POLICY IF EXISTS` antes, para a migration ser reaplicavel.
--
-- Reversao: drop policy if exists "Agents update own completions" on public.learning_completions;

drop policy if exists "Agents update own completions" on public.learning_completions;

create policy "Agents update own completions"
  on public.learning_completions
  for update
  to authenticated
  using (public.get_user_agent_name() = agent_name)
  with check (public.get_user_agent_name() = agent_name);