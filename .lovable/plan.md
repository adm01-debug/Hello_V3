
A suíte Conversation Intelligence foi finalizada em 10/10 na iteração anterior. Para continuar a jornada rumo à perfeição, identifico os próximos gaps competitivos do roadmap original (além do #1 Conversation Intelligence já entregue) e proponho atacar o próximo bloco crítico.

## Plano: Próxima onda de excelência — Sales Enablement & Revenue Intelligence

### Contexto
Conversation Intelligence (Gong/Chorus) ✅ entregue. Próximos gaps competitivos típicos de plataformas líderes (Gong, Chorus, Outreach, Salesloft):

### Melhorias sequenciais (1 por vez)

**1. Deal Intelligence — vinculação chamada↔oportunidade**
- Tabela `deals` (valor, estágio, probabilidade, contato, owner)
- Vincular `call_sessions.deal_id`
- Página `/deals` com pipeline kanban + health score por IA (baseado em sentimento, momentos-chave, recência)

**2. Forecast assistido por IA**
- Edge function `forecast-deals` agrega deals + sinais de CI (objeções, próximos passos, sentimento)
- Card no Executive Dashboard com previsão semanal/mensal e confiança

**3. Sequências de cadência (multi-touch)**
- Tabela `cadences` + `cadence_steps` (call/whatsapp/task)
- Engine que cria tarefas automáticas conforme passo
- Página `/cadences` para criar/editar e atribuir contatos

**4. Scorecards de chamada (avaliação estruturada)**
- Tabela `call_scorecards` + `scorecard_criteria` (rubrica configurável)
- IA preenche rascunho, supervisor revisa
- Visível em `CallDetailDialog` nova aba "Avaliação"

**5. Trackers customizáveis de palavras/temas**
- Generalização de battle cards: trackers temáticos (compliance, descoberta, fechamento)
- Dashboard de uso por agente

**6. Smart playlists de chamadas para coaching**
- Playlists curadas (auto: "objeções de preço esta semana") e manuais
- Compartilhamento entre supervisor↔agente

**7. Integração CRM bidirecional aprofundada (Bitrix)**
- Sync de deals Bitrix↔sistema, log automático de chamadas como atividades
- Webhook reverso para criar deal a partir de chamada

**8. ADR + memória + testes**
- ADR 009 — Sales Enablement Suite
- `mem://features/sales-enablement`
- Testes unitários para cada hook novo

### Considerações técnicas
- ≤400 linhas/arquivo, PT-BR, logger central, sonner
- Estética cyberpunk neon mantida
- Reutilizar tabelas/edge functions já existentes onde possível
- RLS rigoroso (admin/supervisor full, agent só seus deals)
- Lovable AI (gemini-2.5-flash) para health score e forecast
- Sem novas dependências externas; sem connector obrigatório

### Ordem de execução
1. Migration deals + scorecards + cadences + trackers + playlists (todas as tabelas + RLS)
2. Edge functions: `forecast-deals`, `score-call`, `compute-deal-health`
3. Hooks de dados
4. Páginas Deals, Cadences, novo aba Avaliação
5. Card Forecast no Executive Dashboard
6. Sync Bitrix bidirecional
7. Testes + ADR + memória
