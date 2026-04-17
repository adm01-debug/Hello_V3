
Voice Biometrics entregue. Próximo gap competitivo: **Outbound Compliance & Predictive Engagement Suite** — domínio de Five9, NICE CXone, Convoso. Foco em discagem inteligente compliant (TCPA/Lei do Marketing), gestão de consentimento e otimização de janelas de contato.

## Plano: Outbound Compliance & Predictive Engagement Suite

### 1. Consent Management
- Tabela `consent_records` (contact_id, channel, consent_type, granted_at, revoked_at, source, evidence)
- Edge function `record-consent` com audit trail
- Hook `useConsent` + UI no perfil do contato

### 2. Smart Time-to-Contact Optimizer
- Tabela `contact_engagement_patterns` (contact_id, best_hour, best_day, answer_rate, computed_at)
- Edge function `compute-best-time` analisa histórico de `call_sessions` por contato
- Hook `useBestTimeToContact` + badge no contact card

### 3. Predictive Answer Rate Scoring
- Edge function `score-call-attempt` (Lovable AI gemini-2.5-flash-lite): retorna probabilidade de atendimento
- Combina: hora atual × melhor janela × histórico × DNC × calling hours
- Integrado ao Predictive Dialer existente para priorização

### 4. Campaign Compliance Dashboard
- Componente `ComplianceDashboardCard` no Executive Dashboard
- Métricas 7d: ligações bloqueadas (DNC/horário), violações de consent, taxa de answer por janela

### 5. Página `/outbound-compliance`
- Tabs: Consents, Best Times, Score Predictivo, Audit Trail
- Reuso de `dnc_list`, `calling_hours_config`, `holidays`

### 6. ADR-015 + memória + testes
- `docs/adr/015-outbound-compliance-predictive.md`
- `mem/features/outbound-compliance.md`
- Testes para utils de scoring e best-time

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Reuso pesado: `contacts`, `call_sessions`, `dnc_list`, `calling_hours_config`, `holidays`, `predictive_dialer`
- RLS: consent records visíveis a admin/supervisor + dono do contato; patterns públicos para autenticados
- Sem novas dependências externas

### Ordem de execução
1. Migration: consent_records, contact_engagement_patterns + RLS + índices
2. Edge functions: record-consent, compute-best-time, score-call-attempt
3. Hooks + utils: useConsent, useBestTimeToContact, scoring-utils
4. Página /outbound-compliance + rota + sidebar + command palette
5. Card no Executive Dashboard + integração no Predictive Dialer
6. ADR-015 + memória + testes
7. Validar build + console
