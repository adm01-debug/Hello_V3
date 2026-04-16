
A suíte Conversation Intelligence está implementada e integrada. Resta apenas elevar a qualidade ao nível 10/10 com melhorias incrementais focadas em UX, robustez e cobertura.

## Plano: Excelência 10/10 — Conversation Intelligence

### Melhorias sequenciais (1 por vez)

**1. Battle Cards seed + UX da página**
- Migration de seed com 3 battle cards exemplo (concorrentes brasileiros típicos: RD Station, HubSpot, Pipedrive) e triggers de keywords
- Adicionar empty state cyberpunk com CTA "Criar primeiro battle card" em `BattleCards.tsx`
- Adicionar busca/filtro por concorrente

**2. Aprimorar BattleCardAlert (toast → painel lateral persistente)**
- Trocar toast efêmero por sheet/drawer lateral com glassmorphism neon
- Botão "Marcar como usado" que registra em `coaching_timestamps` para análise posterior
- Auto-dismiss configurável (30s padrão)

**3. CallLibrary — destaque de snippet + filtros avançados**
- Highlight de palavras-chave no snippet (`<mark>` com glow neon)
- Filtros laterais: data range, agente, sentimento, duração mínima, presença de momento-chave (preço/concorrente/objeção)
- Paginação server-side via tsvector ranking

**4. Persistência ativa de LiveSentiment durante chamada**
- Integrar `useLiveSentiment.recordSnapshot()` no `LiveCallAnalysis` quando `realtime-analysis` retornar resultado
- Throttle de 5s entre snapshots para não sobrecarregar DB

**5. CallDetailDialog — player sincronizado com transcrição e momentos**
- Conectar `CallPlayerWithTranscript` ao audio_url da gravação (storage signed URL)
- Click em momento-chave ou linha de transcrição pula para timestamp no player
- Marcadores visuais na barra de progresso (key moments + coaching timestamps)

**6. Busca por momento-chave em CallLibrary**
- Tab adicional "Por Momento-Chave" listando chamadas agrupadas por tipo (preço, concorrente, objeção, próximo passo)
- Card com quote destacada e link direto para o momento

**7. Métricas agregadas no Dashboard Executivo**
- Card novo "Conversation Intelligence" com:
  - Talk ratio médio dos agentes (vs benchmark 40-60%)
  - Top 3 concorrentes mencionados
  - % chamadas com objeção detectada
  - Total de momentos-chave da semana

**8. Testes adicionais**
- `useCallSearch` (filtros + paginação)
- `useTalkRatio` (estados loading/error)
- Edge function `detect-key-moments` (validação de input via teste de schema)

**9. Documentação ADR**
- `docs/adr/008-conversation-intelligence.md` documentando decisões: Lovable AI para detecção, tsvector PT-BR para busca, integração Teams adiada, persistência via background functions

**10. Atualização de memória**
- Refresh de `mem://features/conversation-intelligence` com estado final (10/10)
- Atualizar `mem://index.md` core com referência à suíte completa

### Considerações técnicas
- ≤400 linhas/arquivo, PT-BR, logger central, sonner para toasts pontuais
- Estética cyberpunk neon mantida (glassmorphism, glow em alerts e marcadores)
- Sem novas dependências externas
- Sem necessidade de connector Teams (continua opcional)
- Cada melhoria é commitada/entregue como bloco coeso antes da próxima
