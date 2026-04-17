---
name: Omnichannel Suite
description: Suíte completa Zendesk/Freshdesk-like — inbox unificado (WhatsApp/e-mail/chat/SMS/voz), KB com FTS PT-BR, routing rules declarativas, SLA policies + enforcement, chatbot triagem (ADR 012)
type: feature
---

# Omnichannel Suite (ADR 012)

## Tabelas
- `conversations`, `messages` — inbox unificado por canal/status/prioridade
- `kb_articles` — base de conhecimento com `search_vector` (tsvector PT-BR)
- `routing_rules` — regras declarativas (JSON conditions/actions) + match_count
- `sla_policies` — por canal+prioridade (first_response_minutes, resolution_minutes)
- `bot_conversations` — histórico de interações do chatbot
- `chat_sessions` — visitantes do widget web

## Edge functions
- `whatsapp-inbound`, `email-inbound`, `chat-widget-session` — ingest
- `chatbot-respond` (gemini-2.5-flash-lite) — resposta + handoff
- `enforce-sla` — marca `sla_breached` e cria alertas

## Páginas
- `/inbox` — caixa de entrada unificada (filtros canal/status, painel de mensagens)
- `/knowledge` — CRUD de artigos com busca FTS
- `/routing-rules` — CRUD declarativo (supervisor/admin)
- `/sla-policies` — CRUD + dashboard de compliance 7d (supervisor/admin)

## Hooks
`useConversations`, `useConversationMessages`, `useSendMessage`, `useUpdateConversation`,
`useKnowledgeBase`, `useRoutingRules`, `useUpsertRoutingRule`, `useDeleteRoutingRule`,
`useSlaPolicies`, `useUpsertSlaPolicy`, `useSlaCompliance`, `useChatbot`.

## Integrações
- Sidebar grupo "Atendimento" (mainNavItems → omnichannelNavItems → toolsNavItems)
- CommandPalette grupo "Atendimento" (4 entradas)
- ExecutiveDashboard → `OmnichannelCard` (abertas, SLA 7d, violações, breakdown por canal)

## RLS
- Conversas: agente vê atribuídas; supervisor/admin vê tudo
- KB: leitura pública autenticada; edição supervisor/admin
- Routing/SLA: leitura autenticada; CRUD supervisor/admin
