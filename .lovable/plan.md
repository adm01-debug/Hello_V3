
Onda 19 entregue. Proponho **Onda 20 — Voz Conversacional sobre Diagnósticos VoIP + Resumos Executivos Automáticos**, fechando o ciclo com interação natural e relatórios prontos para liderança.

## Onda 20 — Voice Q&A + Executive Auto-Summary

### 1. Edge function `voip-diagnostic-voice-qa`
- `POST { question: string, period?: 'day'|'week'|'month' }`
- Agrega contexto: últimas recomendações, insights (effectiveness, heatmap), alertas críticos, histórico de ações
- Chama Lovable AI (`google/gemini-2.5-flash`) com system prompt PT-BR especializado em VoIP
- Retorna `{ answer, citations[], confidence, requestId }`
- JWT + CORS + validação Zod-like (question 5-500 chars)
- 4 testes Deno (auth, validação, resposta com contexto, erro AI gateway)

### 2. Edge function `voip-executive-summary`
- `POST { period: 'week'|'month', format?: 'markdown'|'plain' }`
- Sumariza: KPIs (MOS médio, alertas, effectiveness), top 3 recomendações aplicadas, padrões temporais, recomendações pendentes
- Lovable AI gera narrativa executiva PT-BR (≤400 palavras)
- Retorna `{ summary, kpis, generatedAt, requestId }`
- 3 testes Deno (auth, validação, geração com dados)

### 3. Hooks
- `useVoipDiagnosticVoiceQA` (mutation, sem cache)
- `useVoipExecutiveSummary` (query, staleTime 10min)

### 4. Componente `VoipVoiceQAPanel`
- Card glass-card em `/network-diagnostics`
- Input de texto + botão microfone (Web Speech API nativa, fallback texto)
- Sugestões rápidas: "Por que MOS caiu hoje?", "Quais agentes mais afetados?", "O que aplicar primeiro?"
- Resposta com markdown rendering + citações clicáveis (linkam para seções relevantes)
- Histórico das últimas 5 perguntas em `localStorage`

### 5. Componente `ExecutiveSummaryDialog`
- Botão "Resumo Executivo" no header de `/network-diagnostics`
- Dialog com narrativa formatada + KPIs em grid + CTA "Copiar" e "Exportar PDF" (jsPDF já presente ou texto puro)
- Seletor período: semana/mês

### 6. Documentação
- ADR-035 em `docs/adr/035-onda-20-voice-qa-executive-summary.md`
- `mem/features/voip-voice-qa-executive.md` + atualizar `mem/index.md`
- Atualizar `docs/audit/scorecard-final.md` (22 edge functions, ~116 testes Deno)

## Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Reuso de Lovable AI Gateway (sem nova API key)
- Web Speech API com graceful degradation para input texto
- Zero novas tabelas; reuso total das ondas 17/18/19
- Loop completo + interação humana natural: perguntar em voz → entender → agir → reportar

## Ordem de execução
1. Edge function `voip-diagnostic-voice-qa` + 4 testes
2. Edge function `voip-executive-summary` + 3 testes
3. Hooks `useVoipDiagnosticVoiceQA` + `useVoipExecutiveSummary`
4. `VoipVoiceQAPanel` integrado em `/network-diagnostics`
5. `ExecutiveSummaryDialog` no header
6. ADR-035 + memória + scorecard
