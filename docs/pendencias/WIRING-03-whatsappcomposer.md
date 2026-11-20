# WIRING-03 — WhatsappComposer órfão
- **Origem:** docs/estado/funcionalidades-planejadas.md §5/§2 (Unified Inbox).
- **Estado real:** NÃO IMPLEMENTADO (wiring). `src/components/whatsapp/WhatsappComposer.tsx` (106 linhas), **0 importadores**. Rota `/inbox` usa `src/pages/Inbox`, que tem seu próprio composer (textarea + send). Composer órfão não é consumido.
- **O que falta:** decidir se o WhatsappComposer substitui o composer atual do Inbox (exige verificar se faz mais que o existente).
- **Camadas:** UI.
- **Critério de aceite:** component integrado ao /inbox ou DESCARTADO se redundante.
- **Estado:** AGUARDANDO HUMANO — exige comparar com o composer atual do Inbox e decidir substituição sem regressão.
