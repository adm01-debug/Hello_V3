
Auditoria identificou 2 ERRORs de segurança + gaps de tipagem/testes. Vou executar em 3 ondas sequenciais (uma melhoria por vez), começando pelos P0 críticos.

## Onda 23 — Quick Wins de Segurança (P0)

### Passo 1: Patch RLS `user_profiles` — bloquear privilege escalation
- Migration: revogar `INSERT` direto de `authenticated`; manter apenas trigger `handle_new_user` (SECURITY DEFINER) como caminho válido
- Reforçar trigger `prevent_role_escalation` no `BEFORE UPDATE` (já existe a função, garantir attach)
- Policy de `UPDATE`: usuário só atualiza próprios campos não-críticos (`full_name`, `avatar_url`); `role`/`agent_id` apenas via admin

### Passo 2: Proteger Realtime `meeting_summaries`
- Migration: garantir RLS estrito na tabela base (ADR-017 cobriu INSERT, validar SELECT)
- Remover da publicação `supabase_realtime` se exposto sem necessidade, OU reforçar policy SELECT exigindo participação na call
- Documentar em ADR-038

### Passo 3: Habilitar HIBP (leaked password protection)
- `configure_auth({ password_hibp_enabled: true })`

### Passo 4: Refinar policies "always true" (3 WARN linter)
- Investigar `pg_policies` para identificar as 3 policies sinalizadas
- Reescrever para `TO authenticated USING (auth.uid() IS NOT NULL)` quando possível
- Documentar exceções legítimas (ex.: `kb_articles` público) com COMMENT na policy

## Onda 24 — Tipagem & Type Safety

### Passo 5: Eliminar `(supabase as any)` em hooks de domínio
- Alvos: ~20 hooks identificados (`useComplianceRules`, `useCallSession`, etc.)
- Substituir por tipos derivados de `Database['public']['Tables'][...]['Row'|'Insert'|'Update']`
- Manter `as any` apenas em interop documentado (Recharts/WebAudio/Radix refs) — ADR-022

### Passo 6: ADR-039 + memória + scorecard atualizado

## Onda 25 — Robustez & Testes

### Passo 7: Optimistic locking em `deals` e `contacts`
- Migration: adicionar coluna `version INTEGER NOT NULL DEFAULT 1`
- Trigger `BEFORE UPDATE` incrementa `version` e rejeita se cliente envia versão desatualizada
- Atualizar hooks `useDeals`/`useContacts` para enviar `version` em mutations

### Passo 8: Gate de cobertura Vitest no CI
- `.github/workflows/ci.yml`: adicionar `--coverage` + threshold 75% em `src/lib/`, `src/hooks/`
- Script `bun run test:coverage` no `package.json`

### Passo 9: Fechamento — ADR-040, scorecard final, memória `onda-23-25-fechamento.md`

## Considerações
- Cada passo: 1 commit lógico, validado via linter Supabase + security scan
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon mantidos
- Zero breaking changes em APIs públicas
- Migrations reversíveis (down implícito via `DROP POLICY` / `ALTER TABLE DROP COLUMN`)

## Ordem de execução
1. Migration RLS user_profiles + trigger role escalation
2. Migration Realtime meeting_summaries hardening
3. configure_auth HIBP
4. Migration refinar 3 policies "always true"
5. Refator de tipagem em ~20 hooks (sem `as any`)
6. ADR-038/039 + memórias intermediárias
7. Migration optimistic locking deals + contacts
8. CI coverage gate
9. ADR-040 + scorecard 10/10 + memória de fechamento

Resultado esperado: **8.4/10 → 10/10 ponderado**, com 0 ERRORs de linter, HIBP ativo, zero `as any` evitável, cobertura ≥75% e locking otimista em entidades críticas.
