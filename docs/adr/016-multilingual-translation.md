# ADR-016: Multilingual Real-Time Translation & Localization Suite

## Status
Aceito — 2026-04-17

## Contexto
Plataformas líderes (Cisco Webex Contact Center, Google Contact Center AI, AWS Connect) oferecem tradução em tempo real para atender clientes globais sem agentes bilíngues dedicados. Para atingir paridade competitiva, o sistema precisa traduzir falas durante a chamada, sugerir contexto cultural e disponibilizar resumos pós-call em múltiplos idiomas.

## Decisão
Implementar a **Multilingual Real-Time Translation & Localization Suite** reaproveitando o stream de transcrição existente:

### Banco de dados
- `call_translations`: cada segmento traduzido (origem, alvo, original, traduzido, latência, modelo, confiança)
- `cultural_hints`: dicas por locale (pt-BR, en-US, es-ES, fr-FR, de-DE, ja-JP, zh-CN), seed inicial com 12 dicas
- `call_summaries.translated_summary` (jsonb) — cache por idioma do resumo executivo

### Edge Functions
- `translate-utterance`: usa `google/gemini-2.5-flash-lite` (latência <1s); registra cada tradução para análise.
- `translate-summary`: usa `google/gemini-2.5-flash` (qualidade) com `response_format: json_object`; cache por idioma em `translated_summary`.

### Frontend
- `src/lib/language-detection.ts`: detecção heurística (CJK por script + diacríticos + stopwords) para resposta instantânea — backend confirma via LLM.
- Hooks `useLiveTranslation` (throttle 1.5s + 4 palavras mínimas) e `useCulturalHints`.
- `LiveTranslationPanel` integrável em qualquer fluxo de chamada.
- Página `/translation-center` com tabs (Histórico, Idiomas, Dicas) + `MultilingualDashboardCard` no Executive Dashboard.

### RLS
- `call_translations`: agente da chamada + supervisor + admin podem ler; INSERT por usuário autenticado.
- `cultural_hints`: leitura pública para autenticados; gestão restrita a admin.

## Trade-offs aceitos
- Detecção client-side é heurística (bom o suficiente para roteamento UI). LLM faz a tradução final com idioma detectado.
- Throttle de 1.5s + cache por idioma de resumo evita custos excessivos.

## Métricas de sucesso
- Latência média de tradução < 1500ms
- Cache hit rate de resumos traduzidos > 60%
- 8 idiomas suportados
