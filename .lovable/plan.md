
Meeting Summary AI fechado em 10/10 (ADR-012 + 13 testes). Próximo gap competitivo identificado: **Real-Time Agent Assist & Next-Best-Action** — domínio de plataformas como Cresta, Balto, Observe.AI e Cogito que oferecem coaching ao vivo durante a chamada.

## Plano: Real-Time Agent Assist & Next-Best-Action Suite

### Melhorias sequenciais (1 por vez)

**1. Live Transcription Stream + Intent Detection**
- Edge function `analyze-live-utterance` (Lovable AI gemini-2.5-flash-lite, baixa latência)
- Detecta intents: objeção, pergunta técnica, pedido de desconto, sinal de compra, risco de churn
- Tabela `live_assist_signals` (call_session_id, timestamp, intent, confidence, suggestion)

**2. Next-Best-Action Engine**
- Componente `NextBestActionPanel.tsx` no `ActiveCallDisplay`
- Sugestões contextuais em tempo real: snippets de resposta, links KB, battle cards relevantes
- Reuso de `kb_articles` (Omnichannel) + `battle_cards` (Conversation Intelligence)

**3. Smart Objection Handler**
- Tabela `objection_library` (objection_type, recommended_response, success_rate)
- Pop-up discreto quando IA detecta objeção conhecida
- Tracking de aceitação (agente usou? deal fechou?)

**4. Compliance Guardrails ao vivo**
- Detecção de palavras proibidas, promessas indevidas, omissão de disclaimers
- Tabela `compliance_rules` (pattern, severity, required_disclaimer)
- Alerta visual + log para auditoria

**5. Sentiment & Stress Indicator**
- Análise contínua a cada 10s da janela recente de transcrição
- Indicador visual (calmo / engajado / frustrado / risco)
- Sugestão de pausa/desescalada quando frustrado por >30s

**6. Auto-fill CRM durante a call**
- Edge function `extract-crm-fields` rola em background
- Sugere atualização de campos do contato (cargo, empresa, dor mencionada, budget)
- Confirmação 1-clique pós-call

**7. Página `/agent-assist` + Dashboard widget**
- Histórico de assistências por call, taxa de aceitação
- Widget "Top objections this week" + "Best performing snippets"

**8. ADR-013 + memória + testes**
- `docs/adr/013-real-time-agent-assist.md`
- `mem://features/agent-assist.md`
- Testes para hooks principais e utils de detecção

### Considerações técnicas
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, estética cyberpunk neon
- gemini-2.5-flash-lite para latência (<1s); fallback gemini-2.5-flash para qualidade
- Reuso pesado: `call_transcripts`, `kb_articles`, `battle_cards`, `meeting_summaries`
- Throttle: análise a cada 5s ou 50 palavras novas (custo controlado)
- RLS: agente vê apenas suas próprias assistências; supervisor/admin full
- Sem novas dependências externas

### Ordem de execução
1. Migration: live_assist_signals, objection_library, compliance_rules + RLS + índices
2. Edge functions: analyze-live-utterance, extract-crm-fields
3. Hooks: useLiveAssist, useObjectionLibrary, useComplianceRules, useAgentAssistHistory
4. Componentes: NextBestActionPanel, ObjectionPopover, ComplianceAlert, SentimentIndicator
5. Integração em ActiveCallDisplay + auto-fill pós-call
6. Página /agent-assist + rota + sidebar + command palette
7. Card no Executive Dashboard
8. Testes + ADR-013 + memória
