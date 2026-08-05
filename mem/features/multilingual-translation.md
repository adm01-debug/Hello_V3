---
name: Multilingual Real-Time Translation Suite
description: Tradução em tempo real durante chamadas, dicas culturais, resumos traduzidos e centro de tradução (ADR-016)
type: feature
---

Suíte multilíngue para call center global. 8 idiomas: pt, en, es, fr, it, de, ja, zh.

**Backend**:
- Tabela `call_translations` armazena cada segmento traduzido com latência, modelo, confiança.
- Tabela `cultural_hints` com dicas por locale (pt-BR, en-US, es-ES, fr-FR, de-DE, ja-JP, zh-CN) — seed de 12 dicas.
- `call_summaries.translated_summary` (jsonb) cacheia resumos por idioma.

**Edge Functions**:
- `translate-utterance`: gemini-2.5-flash-lite, latência <1s. Auto-detect lang via cliente + LLM.
- `translate-summary`: gemini-2.5-flash com `response_format: json_object`, cache por idioma.

**Frontend**:
- `src/lib/language-detection.ts`: detecção heurística instantânea (CJK + diacríticos + stopwords).
- Hooks `useLiveTranslation` (throttle 1.5s, ≥4 palavras), `useCulturalHints`.
- Componente `LiveTranslationPanel` (split original × traduzido + dicas culturais + entrada manual).
- Página `/translation-center` (tabs: Histórico, Idiomas, Dicas).
- `MultilingualDashboardCard` no Executive Dashboard.

**Sidebar/CommandPalette**: rota "Tradução Multilíngue" em `/translation-center`.

**RLS**:
- `call_translations`: agente da call + supervisor + admin leem; insert por autenticados.
- `cultural_hints`: leitura para autenticados, gestão admin-only.

**Testes**: 9 testes em `src/lib/__tests__/language-detection.test.ts` (CJK, diacríticos, stopwords, fallback).
