# ADR 008 — Conversation Intelligence (estilo Gong/Chorus)

**Status**: Aceito
**Data**: 2026-04-16

## Contexto

O sistema precisava alcançar paridade funcional com plataformas líderes de Conversation Intelligence (Gong, Chorus, Avoma) para acelerar a evolução comercial e de coaching das equipes. Os requisitos críticos eram:

- Análise de talk ratio (vendedor vs cliente) com benchmark
- Detecção automática de momentos-chave (preço, concorrente, objeção, próximo passo)
- Battle cards acionados em tempo real quando concorrentes são citados
- Biblioteca de chamadas com busca full-text em português
- Coaching com timestamps clicáveis e player sincronizado
- Sentimento ao vivo persistido para análise pós-chamada
- Importação opcional de gravações externas (Microsoft Teams)

## Decisão

### IA — Lovable AI Gateway (`google/gemini-2.5-flash`)
Escolhido pela combinação de custo controlado, baixa latência e suporte nativo a português. Usado em `detect-key-moments`, `analyze-talk-ratio` (parsing/normalização) e `generate-coaching` (geração de feedback com timestamps).

### Busca — `tsvector` PT-BR + índice GIN
Tabela dedicada `call_transcripts_searchable` populada por trigger ao final de cada chamada. Configuração `portuguese` do PostgreSQL para stemming e stop-words. Edge function `search-calls` aplica `ts_rank` para ordenação por relevância e snippet via `ts_headline`.

### Persistência — invocação background
Em `useCallSession.endSession`, as funções pesadas (`analyze-talk-ratio`, `detect-key-moments`, indexação de transcrição) são disparadas via `supabase.functions.invoke` sem bloquear o UI. O `LiveCallAnalysis` salva snapshots de sentimento a cada 5 segundos durante a chamada (throttle).

### Battle Cards — match em tempo real no client
`useBattleCardDetection` faz match dos triggers (modos: contains/exact/starts_with) localmente para latência mínima, com dedupe "fired-once" por chamada. O painel lateral persistente (`BattleCardAlert`) mantém o card visível até dispensa explícita ou marcação como utilizado (que registra em `coaching_timestamps`).

### Microsoft Teams — adiado
A edge function `teams-fetch-recordings` está pronta consumindo `https://connector-gateway.lovable.dev/microsoft_teams`, mas o connector ainda não foi aprovado/linkado pelo cliente. Sem ele, a página `/external-recordings-import` exibe estado "não conectado" sem quebrar o fluxo principal.

## Consequências

### Positivas
- **Custo de IA controlado** pelo modelo flash + invocação assíncrona apenas pós-chamada
- **Busca rápida e precisa** em PT-BR via PostgreSQL nativo (sem dependência de Elasticsearch)
- **UX em tempo real** sem latência de rede para battle cards (match no client)
- **Coaching acionável** — timestamps clicáveis pulam diretamente no player de gravação
- **Fallback seguro** — funcionalidades degradam graciosamente quando IA/connector indisponíveis

### Negativas / Trade-offs
- **Dependência de qualidade da transcrição** — momentos-chave e talk ratio refletem fidelidade do STT (ElevenLabs)
- **Importação Teams pendente** até aprovação do connector pelo cliente
- **Talk ratio agregado no dashboard** atualmente mostra benchmark fixo; uma tabela `talk_ratio_aggregations` futura permitiria média real
- **Limite de 6 timestamps por chamada** em `coaching_timestamps` para evitar ruído — pode ser ajustado conforme feedback

## Referências
- Tabelas: `call_key_moments`, `battle_cards`, `battle_card_triggers`, `call_transcripts_searchable`, `coaching_timestamps`, `live_sentiment_snapshots`
- Edge functions: `analyze-talk-ratio`, `detect-key-moments`, `search-calls`, `teams-fetch-recordings`, `generate-coaching`
- Páginas: `/call-library`, `/battle-cards`, `/external-recordings-import`
- Memória: `mem://features/conversation-intelligence`
