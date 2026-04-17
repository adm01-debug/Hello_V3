---
name: outbound-compliance
description: Suíte Outbound Compliance & Predictive Engagement — consent management TCPA/LGPD, melhor janela de contato e score preditivo de atendimento para o Predictive Dialer
type: feature
---

# Outbound Compliance & Predictive Engagement

## Componentes
- **Tabelas**: `consent_records` (opt-in/out audit), `contact_engagement_patterns` (best_hour, best_day, answer_rate por contato)
- **Edge functions**: `record-consent`, `compute-best-time`, `score-call-attempt` (todas em PT-BR, validação central)
- **Hooks**: `useConsent`, `useBestTimeToContact`, `useCallScoring`
- **Util**: `src/lib/outbound-scoring.ts` (scoring determinístico client-side espelhando edge function)
- **Página**: `/outbound-compliance` (admin/supervisor) com 4 tabs: Consents, Best Times, Score Preditivo, Audit Trail
- **Card dashboard**: `OutboundComplianceCard` no Executive Dashboard

## Regras de scoring
1. DNC → score 0, recomendação `block`
2. Fora do horário → score × 0.1
3. Histórico ≥ 3 tentativas: base = 0.3 + answer_rate × 0.4
4. Hora atual = best_hour (±1h) → +0.2
5. Dia atual = best_day_of_week → +0.1
6. Recomendações: ≥0.7 high_priority, ≥0.4 normal, ≥0.15 low_priority, <0.15 defer

## RLS
- `consent_records`: SELECT/INSERT/UPDATE admin+supervisor; DELETE só admin
- `contact_engagement_patterns`: SELECT autenticados; ALL só admin (writes via edge function)

## Auditoria
Todo registro/revogação de consentimento gera entrada em `audit_logs` via RPC `log_audit_event`.

## ADR
`docs/adr/015-outbound-compliance-predictive.md` — decisão de heurística determinística vs LLM, justificativa de auditabilidade.

## Testes
`src/lib/__tests__/outbound-scoring.test.ts` — 7 cenários cobrindo DNC, horário, histórico, janela ótima e formatação.
