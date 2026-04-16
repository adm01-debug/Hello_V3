
A suíte de Conversation Intelligence já foi implementada na iteração anterior (migrations, edge functions, hooks, componentes e páginas). O que resta para fechar o loop end-to-end são integrações e ativação real durante chamadas ao vivo.

## Plano: Finalizar integração Conversation Intelligence

### Status (já entregue)
- ✅ Tabelas + RLS + tsvector PT-BR
- ✅ Edge functions: `analyze-talk-ratio`, `detect-key-moments`, `search-calls`, `teams-fetch-recordings`
- ✅ Hooks: `useTalkRatio`, `useKeyMoments`, `useBattleCardDetection`, `useCallSearch`, `useLiveSentiment`
- ✅ Componentes: `TalkRatioChart`, `KeyMomentsTimeline`, `BattleCardAlert`, `LiveSentimentGraph`, `CoachingTimeline`, `CallPlayerWithTranscript`
- ✅ Páginas: `CallLibrary`, `BattleCards`, `ExternalRecordingsImport`
- ✅ Sidebar + rotas

### Gaps a fechar

**1. Ativar Battle Cards e LiveSentiment durante chamada ao vivo**
- Integrar `useBattleCardDetection` em `LiveTranscription.tsx`: a cada novo segmento transcrito, chamar `checkText()` e renderizar `<BattleCardAlert />` quando dispara.
- Integrar `LiveSentimentGraph` no `ActiveCallDisplay.tsx` (aba ou drawer "Inteligência").
- Persistir snapshots via `useLiveSentiment.recordSnapshot()` quando `realtime-analysis` retornar novo sentimento.

**2. Pós-chamada automatizado**
- No `useCallSession` ao finalizar chamada com transcrição salva: disparar em background `analyze-talk-ratio` (passando segmentos diarizados) e `detect-key-moments` (passando texto completo).
- Popular `call_transcripts_searchable` com `full_text` + `tsvector` (trigger já existe).

**3. Coaching com timestamps**
- Estender `generate-coaching` para retornar `timestamped_feedback[]` e gravar em `coaching_timestamps`.
- Renderizar `CoachingTimeline` dentro de `CallDetailDialog` sincronizado com player.

**4. Detalhe de chamada unificado**
- Atualizar `CallDetailDialog` para exibir abas: Player+Transcrição, Talk Ratio, Momentos-chave, Coaching, Sentimento — reutilizando os componentes já criados.

**5. Conector Microsoft Teams**
- Solicitar conexão via `standard_connectors--connect` (connector_id `microsoft_teams`).
- Refatorar `teams-fetch-recordings` para usar gateway `https://connector-gateway.lovable.dev/microsoft_teams` com headers `Authorization: Bearer ${LOVABLE_API_KEY}` + `X-Connection-Api-Key: ${TEAMS_API_KEY}`.
- Endpoint: `/me/onlineMeetings/{id}/recordings` para listar e baixar para `call-recordings` bucket.

**6. CommandPalette + páginas**
- Adicionar entradas "Biblioteca de Calls", "Battle Cards", "Importar Gravações Teams" no `CommandPalette.tsx`.

**7. Testes**
- Vitest para `useBattleCardDetection.checkText` (match exact/contains/starts_with).
- Vitest para cálculo de talk ratio (helper extraído da edge function).

### Ordem de execução
1. Integrar Battle Cards + LiveSentiment em `LiveTranscription` / `ActiveCallDisplay`
2. Disparar análises pós-chamada em `useCallSession`
3. Estender `generate-coaching` + persistência
4. Unificar `CallDetailDialog` com abas
5. Conectar Microsoft Teams + refatorar edge function via gateway
6. Adicionar entradas no CommandPalette
7. Testes unitários
8. Atualizar memória do projeto

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner para alertas, estética cyberpunk
- Conector Teams será solicitado durante execução; sem ele, página de import mostra estado "não conectado"
