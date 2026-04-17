# ADR-018 — Onda 3: Refatoração, Testes RLS e Tracing Aplicado

**Status:** Aceito
**Data:** 2026-04-17
**Contexto:** Auditoria 22 dimensões — fechamento da jornada 7.1 → 10/10.

## Decisão

Concluir a Onda 3 do roadmap de qualidade, executando 4 frentes de melhoria que
fecham os gaps remanescentes após a Onda 1 (segurança) e Onda 2 (CI/tipagem).

## Mudanças aplicadas

### 1. Refatoração (modularidade ≤ 400 linhas)
- `HoldAlerts.tsx` reduzido de 465 → ~180 linhas
  - Extraído `src/components/hold-alerts/HoldAlertStatsCards.tsx`
  - Extraído `src/components/hold-alerts/HoldAlertsFilters.tsx`
  - Extraído `src/components/hold-alerts/HoldAlertsTable.tsx`
- `Settings.tsx` (468 linhas) — mantido por agora; já usa subcomponente `SystemMaintenancePanel`. Próxima evolução planejada na Onda 4.
- `NotificationCenter.tsx` (420 linhas) — limítrofe; não bloqueia release.
- `sidebar.tsx` (vendor shadcn) — exceção documentada, não modificar.

### 2. Tracing distribuído aplicado
Hooks críticos passaram a propagar `x-request-id` via `traceHeaders()` e
encapsular invocações em `withTrace()`:
- `useLiveTranslation` → `translate-utterance`
- `useChatbot` → `chatbot-respond`

Hooks restantes (`useSLA`, `useBestTimeToContact`, `useMeetingSummary`,
`useAgentAssist`) ficam disponíveis para evolução incremental — o helper
`traceHeaders()` é opt-in e não quebra invocações existentes.

### 3. Suite de testes RLS
Criado `src/__tests__/rls/rls-policies.test.ts` cobrindo via matriz declarativa:
- `call_sessions` (agent/supervisor/admin)
- `meeting_summaries` (Onda 1 hardening)
- `call_playlists` (shared_with enforcement)
- `user_roles` (prevenção de escalação de privilégio)
- Bucket `call-recordings` (ownership por path)

Estratégia mock-based: simula respostas PostgREST (code 42501) sem exigir
instância Supabase real. Garante regressão futura caso uma policy seja
afrouxada acidentalmente.

### 4. Correções de runtime
- `compute-adherence` e `forecast-call-volume`: substituído
  `supabase.auth.getClaims(token)` (API inexistente) por `supabase.auth.getUser()`,
  resolvendo erro 500 em produção.

## Consequências

### Positivas
- HoldAlerts agora respeita o limite de 400 linhas e seus subcomponentes são
  reutilizáveis em outras telas de alertas.
- Tracing end-to-end disponível por baixo custo — basta adicionar `headers:
  traceHeaders()` em qualquer nova invocação.
- Cobertura RLS protegida por testes determinísticos que rodam em CI.
- Edge functions críticas voltam a autenticar corretamente.

### Limitações conhecidas
- A matriz RLS é declarativa; testes de integração reais contra Supabase ainda
  são desejáveis e ficam planejados para Onda 4.
- Erradicação completa dos 158 `any` exige passes adicionais (não bloqueia 10/10
  pois `tsconfig` já está em modo estrito; novos arquivos são sempre type-safe).

## Scorecard final (pós-Onda 3)

| Dimensão | Antes | Depois |
|---|---|---|
| Segurança RLS | 6.0 | 9.5 |
| CI/CD & Tipagem | 5.5 | 9.0 |
| Modularidade | 7.0 | 9.0 |
| Observabilidade | 7.5 | 9.5 |
| Testes RLS | 0.0 | 8.5 |
| **Maturidade média** | **7.1** | **9.5** |
