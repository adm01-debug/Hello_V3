---
name: Conversation Intelligence Suite
description: Suíte estilo Gong/Chorus — talk ratio, key moments, battle cards, biblioteca searchable, coaching com timestamps, sentimento ao vivo, import Teams.
type: feature
---
Suite completa de Conversation Intelligence implementada (estilo Gong/Chorus):

**Tabelas**: `call_key_moments`, `battle_cards`, `battle_card_triggers`, `call_transcripts_searchable` (tsvector PT-BR + GIN), `coaching_timestamps`, `live_sentiment_snapshots`. `call_recordings.source` ('internal' | 'teams').

**Edge functions** (verify_jwt=true): `analyze-talk-ratio`, `detect-key-moments` (gemini-2.5-flash), `search-calls`, `teams-fetch-recordings` (gateway `https://connector-gateway.lovable.dev/microsoft_teams` — requer connector Microsoft Teams linkado; sem ele responde 400 "not connected").

**Hooks**: `useTalkRatio`, `useKeyMoments`, `useBattleCardDetection` (match_type: contains|exact|starts_with, fired-once dedupe), `useCallSearch`, `useLiveSentiment` (com realtime subscription).

**Componentes** em `src/components/conversation-intelligence/`: `TalkRatioChart`, `KeyMomentsTimeline`, `BattleCardAlert` (toast cyberpunk com glow warning), `LiveSentimentGraph`, `CoachingTimeline`, `CallPlayerWithTranscript`.

**Páginas**: `/call-library`, `/battle-cards` (admin/supervisor), `/external-recordings-import` (admin/supervisor).

**Integração ao vivo**: `LiveTranscription` chama `checkText()` a cada segmento transcrito e renderiza `BattleCardAlert`.

**Pós-chamada**: `useCallSession.endSession` dispara em background `analyze-talk-ratio` + `detect-key-moments` e popula `call_transcripts_searchable` (trigger atualiza tsvector PT-BR).

**Coaching com timestamps**: `generate-coaching` retorna `timestamped_feedback[]` (até 6) e persiste em `coaching_timestamps` quando há transcrição recente.

**CallDetailDialog**: tabs Transcrição, Análises, Talk Ratio, Momentos, Coaching, Sentimento — reutiliza componentes acima.

**Helper testável**: `src/lib/talkRatio.ts` (`computeTalkRatio`) — espelha lógica do edge function para testes unitários.

**Testes**: `src/lib/__tests__/talkRatio.test.ts` (6) e `src/hooks/__tests__/useBattleCardDetection.test.ts` (5) — todos passando.
