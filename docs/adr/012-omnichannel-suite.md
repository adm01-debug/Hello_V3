# ADR 012 — Suíte Omnichannel (Inbox, Knowledge Base, Roteamento, SLA, Chatbot)

**Status:** Aceito
**Data:** 2026-04-17
**Contexto competitivo:** Zendesk, Freshdesk, Intercom, Front

## Contexto
A plataforma já cobria voz, gravações, coaching, agent assist, biometria e tradução. Faltava unificar os canais textuais (WhatsApp, e-mail, chat web, SMS) em uma caixa de entrada única com SLA, roteamento por regras, base de conhecimento e bot de triagem — paridade com líderes do mercado de CX.

## Decisão
Implementar suíte Omnichannel composta por:

1. **Conversations & Messages** — modelo unificado (`conversations`, `messages`) com canal, prioridade, status, SLA, tags, atribuição.
2. **Knowledge Base** — `kb_articles` com busca full-text PT-BR (`tsvector`), categorias e métricas de visualizações.
3. **Routing Rules** — `routing_rules` declarativas (JSON conditions/actions) com prioridade e contagem de matches.
4. **SLA Policies** — `sla_policies` por canal/prioridade (primeira resposta + resolução) e enforcement via edge function `enforce-sla`.
5. **Chatbot de triagem** — `bot_conversations` + edge function `chatbot-respond` (Lovable AI gemini-2.5-flash-lite) com handoff humano automático.
6. **Ingest channels** — edge functions `whatsapp-inbound`, `email-inbound`, `chat-widget-session`.
7. **UI** — páginas `/inbox`, `/knowledge`, `/routing-rules`, `/sla-policies` + grupo "Atendimento" no sidebar + card no Executive Dashboard.

## Consequências
**Positivas**
- Unificação de canais → métrica única de SLA e produtividade.
- Roteamento declarativo permite mudanças de negócio sem deploy.
- Chatbot reduz volume de tickets simples; KB acelera resposta humana.
- Card no dashboard executivo dá visibilidade imediata de violações.

**Negativas / Trade-offs**
- Edge functions de ingest precisam autenticação/whitelisting por provedor (WhatsApp BSP, SMTP).
- Full-text search PT-BR exige reindexação ao mudar `tsvector` config.
- Bot consome tokens Lovable AI — throttling e fallback obrigatórios.

## Padrões mantidos
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon.
- RLS estrita: agentes só veem conversas atribuídas (ou não atribuídas do seu time); supervisor/admin veem tudo.
- React Query (5m staleTime, 30m gcTime).
- Reuso pesado: `agents`, `contacts`, `audit_logs`.
