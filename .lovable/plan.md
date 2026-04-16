
## Plano: Conversation Intelligence (estilo Gong/Chorus)

O sistema já possui boa parte da infraestrutura (gravação, transcrição com diarização ElevenLabs, análise de chamadas, coaching IA). Vou completar os gaps para entregar uma suíte completa de Conversation Intelligence.

### Status atual (já existe)
- ✅ Gravação automática (`useCallRecording` + bucket `call-recordings`)
- ✅ Transcrição com diarização (`voice-transcribe` com `diarize=true`)
- ✅ Análise de sentimento em tempo real (`realtime-analysis`)
- ✅ Coaching IA (`generate-coaching`, `CoachingPanel`)
- ✅ Análise pós-chamada (`analyze-call`)

### Gaps a implementar

**1. Talk Ratio Analysis** (vendedor vs cliente)
- Nova edge function `analyze-talk-ratio` que processa segmentos diarizados e calcula: % fala agente, % fala cliente, % silêncio, longest monologue, interrupções.
- Componente `TalkRatioChart.tsx` (donut + barras com benchmarks: ideal 40-60% agente).

**2. Detecção de Momentos-Chave**
- Nova edge function `detect-key-moments` (Lovable AI / gemini-2.5-flash) que identifica em transcrições: menção de preço, concorrente, objeção, próximo passo, compromisso, risco de churn — retorna array `{type, timestamp, quote, confidence}`.
- Tabela `call_key_moments` (call_session_id, type, timestamp_seconds, quote, confidence, metadata).
- Componente `KeyMomentsTimeline.tsx` — timeline visual clicável que pula para o ponto na gravação.

**3. Battle Cards Automáticos**
- Tabela `battle_cards` (id, competitor_name, our_strengths, their_weaknesses, talking_points, objection_responses).
- Tabela `battle_card_triggers` (card_id, keywords[]).
- Componente `BattleCardAlert.tsx` — popup tipo toast quando concorrente é detectado durante chamada ativa, exibe pontos de batalha.
- Página `BattleCards.tsx` (admin) — CRUD de battle cards.
- Hook `useBattleCardDetection` integrado ao `LiveTranscription` que monitora keywords e dispara o card.

**4. Biblioteca de Calls (Searchable)**
- Tabela `call_transcripts_searchable` com coluna `tsvector` + índice GIN para full-text search PT-BR.
- Trigger que popula `tsvector` quando transcrição é salva.
- Edge function (ou query direta) `search-calls` aceitando palavra-chave, filtros (data, agente, sentimento, momento-chave).
- Página `CallLibrary.tsx` — busca, filtros laterais, lista de chamadas com snippet destacado, player + transcrição sincronizada.

**5. Coaching com Timestamps**
- Estender `generate-coaching` para retornar `timestamped_feedback: [{timestamp, type, message, severity}]`.
- Tabela `coaching_timestamps` para persistência.
- Componente `CoachingTimeline.tsx` — overlay sobre player de áudio com marcadores de coaching.

**6. Sentiment em Tempo Real (aprimorar)**
- Já existe `realtime-analysis`. Adicionar persistência: tabela `live_sentiment_snapshots` (call_session_id, timestamp, sentiment, score, urgency).
- Componente `LiveSentimentGraph.tsx` — gráfico de linha em tempo real durante a chamada.

**7. Gravação automática de plataformas externas (Zoom/Meet/Teams)**
- Esta é uma integração externa complexa que exige OAuth + webhooks de cada plataforma. Como o sistema já tem o Microsoft Teams disponível como connector, vou implementar **somente Microsoft Teams** nesta fase:
  - Edge function `teams-fetch-recordings` que busca gravações do Teams via Graph API e importa para `call-recordings` bucket, criando registro em `call_recordings` com flag `source='teams'`.
  - Página `ExternalRecordingsImport.tsx` para disparar import manual ou via cron.
- Zoom/Meet ficarão documentados como roadmap (exigem connectors não disponíveis).

### Banco de dados (migration)

```text
- call_key_moments
- battle_cards
- battle_card_triggers
- call_transcripts_searchable (tsvector + GIN)
- coaching_timestamps
- live_sentiment_snapshots
- ALTER call_recordings ADD source TEXT DEFAULT 'internal'
```

Todas com RLS: agente vê suas próprias; supervisor/admin vê tudo.

### Edge Functions a criar
1. `analyze-talk-ratio` (verify_jwt=true)
2. `detect-key-moments` (verify_jwt=true)
3. `search-calls` (verify_jwt=true)
4. `teams-fetch-recordings` (verify_jwt=true) — usa connector Microsoft Teams

### Frontend — novas páginas/componentes
- Página `CallLibrary.tsx` (rota `/call-library`)
- Página `BattleCards.tsx` (rota `/battle-cards`, admin/supervisor)
- Componentes em `src/components/conversation-intelligence/`:
  - `TalkRatioChart.tsx`
  - `KeyMomentsTimeline.tsx`
  - `BattleCardAlert.tsx`
  - `LiveSentimentGraph.tsx`
  - `CoachingTimeline.tsx`
  - `CallPlayerWithTranscript.tsx` (player + transcrição sincronizada)
- Hooks: `useTalkRatio`, `useKeyMoments`, `useBattleCardDetection`, `useCallSearch`, `useLiveSentiment`
- Integrar `BattleCardAlert` e `LiveSentimentGraph` em `ActiveCallDisplay` / `LiveTranscription`
- Adicionar entradas no `AppSidebar` e `CommandPalette`

### Conector necessário
- **Microsoft Teams** (já listado como standard connector). Vou solicitar conexão antes de implementar `teams-fetch-recordings`.

### Considerações técnicas
- Limite 400 linhas por arquivo — todos os componentes serão modulares
- Logger centralizado (`src/lib/logger.ts`)
- Sonner para notificações (battle card alerts, imports concluídos)
- PT-BR em toda UI/mensagens
- Estética cyberpunk neon mantida (glassmorphism, glow nos alertas)
- Validação Zod + edge functions com `_shared/validate.ts`
- Rate limiting via `check_rate_limit` RPC

### Ordem de execução
1. Migration (todas as tabelas + RLS + tsvector trigger)
2. Edge functions (talk-ratio, key-moments, search-calls)
3. Hooks de dados
4. Componentes visuais
5. Páginas Library + BattleCards
6. Integração no fluxo de chamada ativa (alerts em tempo real)
7. Conexão Teams + função de import
8. Atualização de sidebar/rotas/command palette
9. Memórias atualizadas no índice
