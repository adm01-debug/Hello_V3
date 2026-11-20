# WIRING-03 — WhatsappComposer órfão
- **Origem:** docs/estado/funcionalidades-planejadas.md §5/§2 (Unified Inbox).
- **Estado real:** NÃO IMPLEMENTADO (wiring). `src/components/whatsapp/WhatsappComposer.tsx` (106 linhas), **0 importadores**. Rota `/inbox` usa `src/pages/Inbox`, que tem seu próprio composer (textarea + send). Composer órfão não é consumido.
- **O que falta:** decidir se o WhatsappComposer substitui o composer atual do Inbox (exige verificar se faz mais que o existente).
- **Camadas:** UI.
- **Critério de aceite:** component integrado ao /inbox ou DESCARTADO se redundante.
- **Estado:** CONCLUÍDO (2026-11-20). `WhatsappComposer` integrado ao `ConversationThread` do `/inbox` **somente para `channel === 'whatsapp'`** (via `useConversations`, tabela `conversations`), substituindo o botão fixo "Melhorar com IA" (tom fixo 'profissional') pelo composer com seletor de 4 tons (profissional/amigável/conciso/empático) + botão Enviar. Canais não-whatsapp mantêm textarea/nota interna originais (sem regressão). `conversations` = 0 linhas hoje → empty state domina; `context` = `conversation.subject`. Verificado por type-check/lint.
