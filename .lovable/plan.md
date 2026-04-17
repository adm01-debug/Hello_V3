
Faltam 2 itens do plano Real-Time Agent Assist para fechar 10/10: integração no `ActiveCallDisplay` + card no Executive Dashboard. Depois disso, seguirei para a próxima suíte competitiva.

## Plano: Fechar Agent Assist 10/10 + próxima suíte (Voice Biometrics & Authentication)

### Parte A — Fechar Agent Assist (3 ajustes)

**A1. Plugar `NextBestActionPanel` + `CrmSuggestionsCard` no `ActiveCallDisplay`**
- Localizar `src/components/calls/ActiveCallDisplay.tsx`
- Adicionar `<NextBestActionPanel callSessionId={...} agentName={...} />` no painel lateral
- Conectar `useLiveAssist().analyze()` ao stream de transcrição existente (dispara quando há nova fala do customer/agent)
- Adicionar `<CrmSuggestionsCard>` que aparece no end-of-call (status='ended')

**A2. Auto-trigger `extract-crm-fields` no `useCallSession.endSession`**
- Replicar gate do meeting summary (≥60s + transcrição) para disparar extração CRM em background

**A3. Card `AgentAssistDashboardCard` no Executive Dashboard**
- Componente novo `src/components/executive/AgentAssistDashboardCard.tsx`
- Mostra: sinais (7d), taxa de aceitação, top intent, alertas de compliance
- Plugar em `src/pages/ExecutiveDashboard.tsx`

### Parte B — Próxima suíte: Voice Biometrics & Fraud Detection

Domínio de Pindrop, Nuance Gatekeeper, ID R&D. Gap competitivo importante para call centers financeiros/saúde.

**B1. Voice Enrollment & Verification**
- Tabela `voice_prints` (user_id, embedding jsonb, sample_count, confidence_baseline)
- Edge function `enroll-voice` e `verify-voice` usando Lovable AI para extração de features e similaridade

**B2. Fraud Risk Scoring em tempo real**
- Tabela `fraud_signals` (call_session_id, signal_type, risk_score, evidence)
- Detecta: voice mismatch, deepfake markers, social engineering patterns

**B3. Compliance Recording & PCI Redaction**
- Edge function `redact-sensitive-audio` que mascara CPF/cartão na gravação pós-call
- Tabela `redaction_log`

**B4. Página `/voice-security` + ADR-014 + memória + testes**

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Reuso pesado: `call_sessions`, `call_transcripts`, `call-recordings` bucket
- RLS rigorosa: voice_prints só do próprio user; fraud_signals admin/supervisor
- Sem novas dependências externas

### Ordem de execução
1. A1 — integrar componentes no ActiveCallDisplay
2. A2 — auto-trigger CRM no endSession
3. A3 — card dashboard executivo
4. Validar build + console
5. B1-B4 sequencialmente
