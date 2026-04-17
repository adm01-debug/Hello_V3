---
name: Real-Time Agent Assist
description: Copiloto ao vivo durante a chamada — sinais, objeções, compliance guardrails, auto-fill CRM (ADR-013)
type: feature
---

Suíte estilo Cresta/Balto/Observe.AI implementada como camada in-call complementar à Conversation Intelligence (pós-call).

**Tabelas:**
- `live_assist_signals` — intents, sugestões, confiança, source (compliance/objection_library/live_analysis); RLS por agente.
- `objection_library` — biblioteca curada com `success_rate`, `times_used`, `times_won`.
- `compliance_rules` — regex/keyword + severity + disclaimer; admin/supervisor edita.
- `crm_field_suggestions` — fila pós-call para revisão 1-clique.

**Edge functions:**
- `analyze-live-utterance` — híbrido local (regex/keyword) + IA (`google/gemini-2.5-flash-lite`); throttle no client a cada 5s/30 palavras.
- `extract-crm-fields` — tool calling com `google/gemini-2.5-flash` para extração estruturada com `source_quote`.

**Hooks/Componentes:**
- `useLiveAssist` (signals em tempo real via Supabase Realtime + throttle), `useObjectionLibrary`, `useComplianceRules`, `useCrmFieldSuggestions`.
- `NextBestActionPanel` plugado em `ActiveCallDisplay`; `CrmSuggestionsCard` aparece após o end-of-call.
- Página `/agent-assist`: histórico, aceitação %, top objeções.
- Utils puros em `src/lib/agent-assist-utils.ts` (rank, dedupe, intent labels/cores).

**Semente inicial:** 5 regras de compliance PT-BR (LGPD, promessas, linguagem) + 5 objeções comuns (price/timing/competitor/authority/trust).
