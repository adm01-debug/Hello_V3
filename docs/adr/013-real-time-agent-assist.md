# ADR 013 — Real-Time Agent Assist & Next-Best-Action

**Status:** Aceito
**Data:** 2026-04-17
**Suíte:** Atendimento / Sales

## Contexto

Plataformas líderes (Cresta, Balto, Observe.AI, Cogito) oferecem coaching ao vivo durante a chamada
com sugestões contextuais, detecção de objeções, guardrails de compliance e análise de sentimento.
Nossa suíte de Conversation Intelligence cobre o **pós-call**; faltava o **in-call**.

## Decisão

Implementar uma camada de **Agent Assist** em tempo real composta por:

1. **Edge function `analyze-live-utterance`** — análise híbrida:
   - **Local** (no edge): regex/keyword matching contra `compliance_rules` e `objection_library`
     → resposta < 200ms para casos conhecidos.
   - **IA** (Gemini 2.5 Flash Lite): detecção de intents contextuais
     (technical_question, discount_request, buying_signal, churn_risk, sentiment_alert).
   - Persistência em `live_assist_signals` com `source` para audit trail.

2. **Throttle no client** (`useLiveAssist`): análise dispara a cada **5s OU 30 palavras novas**,
   o que vier antes — controla custo de IA sem perder responsividade.

3. **Realtime Postgres**: `live_assist_signals` é exposta via Supabase Realtime para o
   `NextBestActionPanel` reagir instantaneamente quando a edge function persiste novos sinais.

4. **Edge function `extract-crm-fields`** — pós-chamada, usa **tool calling** (Gemini 2.5 Flash)
   para extrair sugestões estruturadas (`position`, `company`, `pain_point`, `budget`, etc.)
   com `source_quote` para auditoria. Sugestões ficam em `crm_field_suggestions` com
   status `pending` até revisão 1-clique.

5. **Tabelas dedicadas** (não reuso):
   - `live_assist_signals` — sinais por call, com TTL implícito via cascade.
   - `objection_library` — biblioteca curada com `success_rate` calculado.
   - `compliance_rules` — regex/keyword + severidade + disclaimer obrigatório.
   - `crm_field_suggestions` — fila de revisão pós-call.

## Alternativas consideradas

- **WebSocket dedicado para análise**: descartado — Supabase Realtime + edge function HTTP
  é simples, escala e reusa autenticação. Latência aceitável (~800ms p95).
- **Análise 100% client-side**: descartado — manter prompts e regras no servidor é regra
  de segurança do projeto e permite atualizar lógica sem deploy de frontend.
- **Reusar `meeting_summaries`**: descartado — meeting summary é pós-call; sinais são por-utterance.

## Consequências

**Positivas:**
- Cobertura competitiva equivalente a Cresta/Balto.
- Compliance proativo (LGPD, promessas indevidas) reduz risco regulatório.
- Auto-fill de CRM economiza ~3-5min de pós-call por agente.
- Audit trail completo: cada sinal tem `source`, `confidence`, `metadata`.

**Negativas / mitigadas:**
- Custo de IA por chamada: mitigado por throttle + matching local primeiro.
- Falsos positivos de compliance (regex frágil): mitigado por severity tunável e
  capacidade de desativar regra via toggle.
- RLS: agente vê apenas próprios sinais; admin/supervisor full — alinhado ao padrão do projeto.

## RLS

- `live_assist_signals.SELECT`: `is_admin_or_supervisor() OR agent_name = get_user_agent_name()`
- `objection_library` / `compliance_rules`: leitura autenticada; escrita admin/supervisor
- `crm_field_suggestions`: CRUD para autenticados; delete só admin

## Integração com fluxo existente

- `ActiveCallDisplay` ganha `<NextBestActionPanel>` durante call ativa.
- `useCallSession.endSession` dispara `extract-crm-fields` em background quando há transcrição
  (>= 60s, mesmo gate do meeting summary).
- Nova rota `/agent-assist` mostra histórico, taxa de aceitação e top objections.

## Testes

- `src/lib/__tests__/agent-assist-utils.test.ts` — rank, dedupe, keywords, métricas.
- `src/hooks/__tests__/useLiveAssist.test.ts` — throttle e markUsed.
