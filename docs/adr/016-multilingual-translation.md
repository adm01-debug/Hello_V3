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

## Nota de escopo — localização da interface (2026-11-24, etapa 269)
O título deste ADR cobre **duas** entregas, e só uma foi construída:

- **Tradução em tempo real** (tabelas `call_translations` / `cultural_hints`, edges `translate-utterance` / `translate-summary`,
  `useLiveTranslation`, `useCulturalHints`, `LiveTranslationPanel`, `/translation-center`): **real e em uso**.
- **Localização da interface** (i18n): **não foi construída**. Existiam apenas `i18n.json` (3 locales declarados,
  `defaultLocale: "en"`) e `public/locales/en/common.json` (10 strings), com **zero consumidores** — nada em `src/`,
  `vite.config.ts`, `package.json` ou workflows lia esses arquivos, e não há biblioteca de i18n instalada. A interface
  é hardcoded em português. Os dois arquivos foram **removidos** para não sugerir metade do caminho feito.

Localizar a interface de verdade é um projeto próprio (biblioteca, extração de strings, revisão de texto por locale),
não um arquivo de configuração. Quem retomar deve abrir ADR novo em vez de ressuscitar `i18n.json`.

## Trade-offs aceitos
- Detecção client-side é heurística (bom o suficiente para roteamento UI). LLM faz a tradução final com idioma detectado.
- Throttle de 1.5s + cache por idioma de resumo evita custos excessivos.

## Métricas de sucesso
- Latência média de tradução < 1500ms
- Cache hit rate de resumos traduzidos > 60%
- 8 idiomas suportados
