
Onda 3 completa para fechar 10/10. Execução sequencial sem pausas.

## Plano: Onda 3 — Refatoração + Testes RLS + Cobertura + Tracing aplicado

### 3.1 Refatorar arquivos > 400 linhas (top 5 críticos)
- `Settings.tsx` → extrair `SystemMaintenancePanel`, `IntegrationsTab`, `SecurityTab`, `NotificationsTab` em `src/components/settings/`
- `sidebar.tsx` (shadcn) → manter (vendor); apenas marcar exceção em ADR
- `HoldAlerts.tsx` → extrair `HoldTimer`, `HoldEscalationBadge`, `useHoldThresholds`
- `NotificationCenter.tsx` → extrair `NotificationsList`, `PreferencesPanel` (já existe), `DigestSettings`
- `Compliance.tsx` → extrair `HolidaysManager`, `CallingHoursConfig`, `DNCManager`
- Manter API pública (props/exports) para zero breakage

### 3.2 Suite de testes RLS por role
- `src/__tests__/rls/agent.test.ts` — agente vê só próprias call_sessions, não vê outras
- `src/__tests__/rls/supervisor.test.ts` — supervisor vê tudo da equipe
- `src/__tests__/rls/admin.test.ts` — admin acesso total
- `src/__tests__/rls/storage.test.ts` — bucket call-recordings ownership
- `src/__tests__/rls/meeting-summaries.test.ts` — INSERT só admin/supervisor
- `src/__tests__/rls/call-playlists.test.ts` — shared_with array enforcement
- Mocks de `supabase.auth.getUser()` por role; asserts em policies via PostgREST error codes

### 3.3 Aplicar `traceHeaders()` em invocações críticas
- `useLiveTranslation` (translate-utterance)
- `useChatbot` (chatbot-respond)
- `useSLA` (enforce-sla)
- `useBestTimeToContact` (compute-best-time, score-call-attempt)
- `useMeetingSummary` (generate-meeting-summary)
- `useAgentAssist` (agent-assist-*)

### 3.4 Cobertura de testes para edge functions críticas
- `supabase/functions/translate-utterance/__tests__/index.test.ts`
- `supabase/functions/score-call-attempt/__tests__/index.test.ts`
- `supabase/functions/enforce-sla/__tests__/index.test.ts`
- Foco em: validação JWT, parsing Zod, branches de erro, headers tracing

### 3.5 Erradicar `any`/`as any` (158 → 0)
- Varredura `grep -rn ": any\|as any"` em `src/`
- Substituição por:
  - Tipos do `Database['public']['Tables'][...]['Row']` para resultados Supabase
  - Genéricos `<T>` em utils
  - `unknown` + type guards onde origem é externa
- Lote por diretório (`hooks/`, `pages/`, `components/`)

### 3.6 ADR-018 + memória + atualização do índice
- `docs/adr/018-onda-3-refactor-rls-tracing.md`
- `mem/features/onda-3-quality-10-10.md`
- Atualizar `mem/index.md`

### 3.7 Re-auditoria final
- `supabase--linter` + `security--run_security_scan`
- Scorecard atualizado: meta ≥ 9.5/10 ponderado
- Relatório consolidado de progresso 7.1 → 10/10

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Zero breakage: testes existentes continuam verdes
- RLS testada com mocks (não exige instância real)
- Tracing opt-in (chamadas atuais sem header continuam funcionando)
- Sem novas dependências externas

### Ordem de execução
1. 3.5 Erradicar `any` (base limpa para refactors)
2. 3.1 Refatorar 4 arquivos críticos (Settings, HoldAlerts, NotificationCenter, Compliance)
3. 3.3 Aplicar `traceHeaders()` nos 6 hooks
4. 3.2 Suite testes RLS (6 arquivos)
5. 3.4 Testes edge functions (3 arquivos)
6. 3.6 ADR-018 + memória + índice
7. 3.7 Re-auditoria + scorecard final
