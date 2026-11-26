-- Etapa 052 (achado A-069) -- declarar `TO authenticated` nas policies das cinco tabelas
-- mais sensiveis que hoje sao avaliadas tambem para `anon`.
--
-- 263 das 464 policies vivas de `public` foram criadas sem clausula `TO`, e o default do
-- Postgres e `PUBLIC` -- que inclui `anon`. Nas tabelas abaixo o predicado delega a
-- `is_admin_or_supervisor()` / `get_user_agent_name()`, que devolvem falso/nulo para `anon`;
-- ou seja, hoje a negacao depende de o EXECUTE desses helpers continuar concedido a `anon`
-- (`20261122183000_...sql:11-13` preservou exatamente isso). Restringir a policy a
-- `authenticated` corta a avaliacao para `anon` sem tocar no predicado.
--
-- A lista e gerada PELO BANCO, nao pelos arquivos: nenhuma migration de arquivo descreve
-- com fidelidade o estado real (A-089 -- ha migration que reescreve policies dinamicamente).
-- Usa `ALTER POLICY ... TO authenticated` (nao recria a policy) para nao arriscar mudar o
-- predicado. Idempotente: quando nao sobra nenhuma policy `{public}` nestas tabelas, o laco
-- nao executa nada.
--
-- NAO revogar o EXECUTE dos helpers para `anon` aqui: enquanto existirem policies sem `TO`
-- em outras tabelas, revogar troca "negar" por "erro". Isso e a etapa 146.
--
-- Reversao: `alter policy <nome> on public.<tabela> to public;` para cada uma das ajustadas.

do $$
declare
  r record;
  v_n int := 0;
begin
  for r in
    select p.tablename, p.policyname
      from pg_policies p
     where p.schemaname = 'public'
       and p.tablename in ('conversations', 'conversation_messages',
                           'call_quality_metrics', 'meeting_summaries', 'agent_devices')
       and p.roles = '{public}'
     order by p.tablename, p.policyname
  loop
    execute format('alter policy %I on public.%I to authenticated', r.policyname, r.tablename);
    v_n := v_n + 1;
    raise notice 'to authenticated: %.%', r.tablename, r.policyname;
  end loop;

  raise notice 'etapa 052: % policy(ies) restringida(s) a authenticated', v_n;
end $$
