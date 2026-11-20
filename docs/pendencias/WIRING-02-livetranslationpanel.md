# WIRING-02 — LiveTranslationPanel órfão
- **Origem:** docs/estado/funcionalidades-planejadas.md §5.
- **Estado real:** NÃO IMPLEMENTADO (wiring). `src/components/translation/LiveTranslationPanel.tsx` (125 linhas) existe, **0 importadores**. Rota `/translation-center` usa `src/pages/TranslationCenter` (página própria).
- **O que falta:** decidir se o painel de tradução ao vivo deve integrar a tela de chamada/translation-center; exige decisão de UX.
- **Camadas:** UI.
- **Critério de aceite:** componente importado e usado, ou DESCARTADO com evidência de sobreposição.
- **Estado:** DESCARTADO (2026-11-20) — evidência de sobreposição/estado. (1) `call_sessions` no banco vivo tem 51 linhas, TODAS `completed` (0 chamadas ativas) → não há tela de chamada ao vivo que forneça `callSessionId` em tempo real. (2) `call_translations` = 0 linhas. (3) A rota `/translation-center` já tem página própria (`TranslationCenter`) que lê `call_translations`. Wirear agora criaria UI sem dados (fachada). Revisitar quando houver chamadas ativas com tradução.
