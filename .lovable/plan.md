
Quatro suítes 10/10 entregues: Conversation Intelligence, Sales Enablement, Customer Success, Workforce Management. Próximo gap competitivo: **Omnichannel Engagement & Digital Self-Service** — domínio de plataformas como Genesys Cloud, Talkdesk, Zendesk e Kustomer.

## Plano: Omnichannel Engagement & Self-Service Suite

### Melhorias sequenciais (1 por vez)

**1. Inbox unificada multi-canal**
- Tabela `conversations` (channel: voice/whatsapp/email/chat/sms) + `conversation_messages`
- Página `/inbox` com lista à esquerda + thread à direita (estilo Front/Intercom)
- Filtros por canal, status, agente, tags

**2. WhatsApp Business inbound (texto)**
- Webhook receiver via edge function `whatsapp-inbound`
- Roteamento automático para fila/agente disponível
- Reply direto da inbox (reuso Wavoip token)

**3. Email-to-ticket**
- Tabela `email_tickets` + edge function `email-inbound` (parser básico)
- Threading por subject/in-reply-to
- Assignment automático por regras

**4. Chat widget embarcável**
- Edge function `chat-widget-session` para autenticação anônima
- Tabela `chat_sessions` + integração com inbox unificada
- Snippet JS para clientes embarcarem em sites externos

**5. Knowledge Base interna**
- Tabelas `kb_articles`, `kb_categories`, `kb_article_views`
- Página `/knowledge` com busca full-text (PT-BR, tsvector)
- Sugestão automática de artigos no contexto da conversa

**6. Chatbot/IVR self-service com IA**
- Edge function `chatbot-respond` (Lovable AI gemini-2.5-flash) com KB como contexto
- Handoff para humano quando confiança < 70% ou cliente solicita
- Tabela `bot_conversations` para auditoria

**7. SLA & Routing Rules**
- Tabela `routing_rules` (condições + ações: assign, tag, prioritize)
- Tabela `sla_policies` (first_response, resolution por canal/prioridade)
- Edge function `enforce-sla` rodando periodicamente + alertas

**8. ADR 012 + memória + testes**
- `docs/adr/012-omnichannel-engagement-suite.md`
- `mem://features/omnichannel-engagement.md`
- Testes para `useConversations`, `useKnowledgeBase`, `useRoutingRules`

### Considerações técnicas
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, estética cyberpunk neon
- RLS rigoroso: admin/supervisor full; agent vê apenas conversas atribuídas
- Reuso de `contacts`, `agents`, `agent_status_history` (presença), `accounts`
- Lovable AI (gemini-2.5-flash) para chatbot e sugestão de KB
- Heurísticas determinísticas para SLA/routing (auditável)
- Sem novas dependências externas; webhook WhatsApp/email expostos via edge functions públicas com validação de assinatura

### Ordem de execução
1. Migration: conversations, messages, email_tickets, chat_sessions, kb_*, bot_conversations, routing_rules, sla_policies (+ RLS + tsvector)
2. Edge functions: whatsapp-inbound, email-inbound, chat-widget-session, chatbot-respond, enforce-sla
3. Hooks: useConversations, useKnowledgeBase, useRoutingRules, useSLA, useChatbot
4. Páginas: Inbox, Knowledge, RoutingRules, SLAPolicies
5. Card "Omnichannel" no Executive Dashboard (volume por canal + SLA compliance)
6. Rotas + CommandPalette + AppSidebar (novo grupo "Atendimento")
7. Testes + ADR + memória
