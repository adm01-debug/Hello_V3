
Onda 4 final para cravar 10/10. Restantes da auditoria: refatorar Settings + grandes, zerar `any`/`as any`, completar testes RLS reais, tracing nos hooks restantes, ADR-019.

## Plano: Onda 4 — Fechamento 10/10

### 4.1 Refatorar arquivos > 400 linhas restantes
- `src/pages/Settings.tsx` → extrair em `src/components/settings/`:
  - `SystemMaintenancePanel.tsx`
  - `IntegrationsTab.tsx`
  - `SecurityTab.tsx`
  - `NotificationsTab.tsx`
- `src/pages/NotificationCenter.tsx` (445 linhas) → extrair `NotificationsList` e `PreferencesPanel` para `src/components/notifications/`
- `src/pages/Compliance.tsx` → extrair `HolidaysManager`, `CallingHoursConfig`, `DNCManager` para `src/components/compliance/`
- `src/components/ui/sidebar.tsx` → manter (vendor shadcn) e documentar exceção em ADR-019
- Zero breakage: API pública (props/exports) preservada

### 4.2 Erradicar `any`/`as any` (158 → 0)
Lotes por diretório:
- `src/hooks/` (≈60 ocorrências)
- `src/pages/` (≈50)
- `src/components/` (≈40)
- `src/lib/` (≈8)

Substituições:
- Resultados Supabase → `Database['public']['Tables'][...]['Row']`
- Genéricos `<T>` em utils
- `unknown` + type guards onde origem é externa (webhooks, eventos DOM customizados)

### 4.3 Aplicar `traceHeaders()` nos hooks restantes
- `useSLA` (enforce-sla)
- `useBestTimeToContact` (compute-best-time, score-call-attempt)
- `useMeetingSummary` (generate-meeting-summary)
- `useAgentAssist` (agent-assist-*)
- `useVoiceBiometrics` (voice-print-*)
- `useOutboundCompliance` (check-dnc, check-calling-hours)

### 4.4 Suite RLS estendida
Expandir `src/__tests__/rls/rls-policies.test.ts` com casos negativos:
- `src/__tests__/rls/storage-recordings.test.ts` — ownership do bucket call-recordings
- `src/__tests__/rls/audit-logs.test.ts` — apenas admin lê
- `src/__tests__/rls/rate-limit-logs.test.ts` — apenas admin/sistema lê
- Mocks PostgREST por role (agent/supervisor/admin) com asserts em códigos de erro

### 4.5 Testes para edge functions críticas
- `supabase/functions/translate-utterance/__tests__/index.test.ts`
- `supabase/functions/score-call-attempt/__tests__/index.test.ts`
- `supabase/functions/enforce-sla/__tests__/index.test.ts`
- Cobrir: validação JWT (`getUser()` mockado), parsing Zod, branches de erro, propagação de `x-request-id`

### 4.6 ADR-019 + memória + índice
- `docs/adr/019-onda-4-fechamento-10-10.md`
- `mem/features/onda-4-quality-10-10.md`
- Atualizar `mem/index.md` com referências

### 4.7 Re-auditoria final
- `supabase--linter` + `security--run_security_scan`
- Scorecard atualizado: meta ≥ 9.7/10 ponderado
- Relatório consolidado 7.1 → 10/10 com tabela das 20 dimensões

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Zero breakage: testes existentes (1.527 Vitest + 22 E2E) continuam verdes
- Tracing opt-in (compatível com chamadas legadas)
- Sem novas dependências externas

### Ordem de execução
1. 4.2 Erradicar `any` em `hooks/` (lote 1)
2. 4.2 Erradicar `any` em `pages/` (lote 2)
3. 4.2 Erradicar `any` em `components/` + `lib/` (lote 3)
4. 4.1 Refatorar `Settings.tsx`
5. 4.1 Refatorar `NotificationCenter.tsx` e `Compliance.tsx`
6. 4.3 Aplicar `traceHeaders()` nos 6 hooks restantes
7. 4.4 Estender suite RLS (3 arquivos novos)
8. 4.5 Testes edge functions (3 arquivos)
9. 4.6 ADR-019 + memórias + índice
10. 4.7 Re-auditoria + scorecard final 10/10
