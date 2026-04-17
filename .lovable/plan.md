
Outbound Compliance entregue 10/10. Próximo gap competitivo: **Multilingual Real-Time Translation & Localization Suite** — domínio de Cisco Webex, Google Contact Center AI, AWS Connect. Permite atendimento multilíngue sem agentes bilíngues dedicados.

## Plano: Multilingual Real-Time Translation Suite

### 1. Detecção automática de idioma + tradução ao vivo
- Tabela `call_translations` (call_session_id, segment_id, source_lang, target_lang, original_text, translated_text, confidence, timestamp)
- Edge function `translate-utterance` (Lovable AI gemini-2.5-flash-lite, baixa latência <1s)
- Detecta idioma do cliente automaticamente (pt, en, es, fr, it, de, ja, zh)

### 2. Componente `LiveTranslationPanel` no ActiveCallBar
- Painel split: fala original × tradução em tempo real
- Toggle agente↔cliente, seletor de idioma alvo, indicador de confiança
- Reuso do stream de transcrição existente

### 3. Cultural Context Hints
- Tabela `cultural_hints` (locale, context_type, hint_text, severity)
- Sugestões discretas (ex: "Cliente japonês — evite negação direta", "Espanhol formal — use 'usted'")
- Seed inicial PT-BR para 6 locales principais

### 4. Post-call Translated Summary
- Estende `meeting_summaries` com campo `translated_summary` (jsonb por idioma)
- Edge function `translate-summary` traduz resumo executivo sob demanda
- Útil para compartilhar com stakeholders internacionais

### 5. Página `/translation-center` + Dashboard widget
- Histórico de traduções, estatísticas por idioma, qualidade média
- Card no Executive Dashboard: chamadas multilíngues 7d, top idiomas, accuracy

### 6. ADR-016 + memória + testes
- `docs/adr/016-multilingual-translation.md`
- `mem/features/multilingual-translation.md`
- Testes para utils de detecção de idioma e formatação

### Considerações técnicas
- ≤400 linhas/arquivo, PT-BR na UI, logger central, sonner, cyberpunk neon
- gemini-2.5-flash-lite para latência; gemini-2.5-flash para summaries (qualidade)
- Reuso pesado: `call_transcripts`, `meeting_summaries`, `call_sessions`
- Throttle: traduzir a cada 3s ou 30 palavras novas (custo controlado)
- RLS: tradução só do agente/supervisor da chamada; cultural_hints públicos para autenticados
- Sem novas dependências externas

### Ordem de execução
1. Migration: call_translations, cultural_hints + extensão meeting_summaries + RLS + índices
2. Edge functions: translate-utterance, translate-summary
3. Util `language-detection.ts` + hooks `useLiveTranslation`, `useCulturalHints`
4. Componente `LiveTranslationPanel` + integração no ActiveCallBar
5. Página `/translation-center` + rota + sidebar + command palette
6. Card no Executive Dashboard
7. ADR-016 + memória + testes
8. Validar build + console
