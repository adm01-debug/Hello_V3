---
name: Onda 20 Voice Q&A + Executive Auto-Summary
description: Q&A conversacional PT-BR via Lovable AI sobre estado VoIP + resumo executivo narrativo automático para liderança
type: feature
---

## Componentes

- **Edge `voip-diagnostic-voice-qa`** (POST): agrega contexto 7d (MOS, alertas, ações, piores agentes), envia ao Lovable AI (`google/gemini-2.5-flash`) com system prompt PT-BR especialista VoIP. Retorna `{ answer, citations[], confidence, contextSize, requestId }`. 4 testes Deno.
- **Edge `voip-executive-narrative`** (POST): KPIs (MOS, chamadas, alertas críticos, effectiveness) + top 3 aplicadas + pendingHints heurísticos → IA gera narrativa ≤400 palavras com estrutura fixa (visão geral, positivos, riscos, próximos passos). 3 testes Deno. **Nome distinto** de `voip-executive-summary` (Onda 15 = Health Score numérico).
- **`VoipVoiceQAPanel`**: glass-card em `/network-diagnostics` com input + mic (Web Speech API pt-BR com fallback texto), 4 sugestões rápidas, render markdown via `react-markdown`, citações clicáveis (scrollIntoView em `#quality-heatmap`/`#agent-ranking`/`#quality-alerts`), histórico 5 perguntas em `localStorage` (`voip-voiceqa-history`).
- **`ExecutiveSummaryDialog`**: botão no header, seletor week/month, KPIs em grid 6, narrativa markdown, CTA "Copiar" + "PDF" (jsPDF), regenerar manual. Hook `useVoipExecutiveNarrative` lazy (`enabled = open`), staleTime 10min.

## Fluxo de dados

1. Usuário pergunta (voz ou texto) → hook `useVoipDiagnosticVoiceQA` (mutation, traceHeaders).
2. Edge agrega `call_quality_metrics` + `voip_quality_alerts` + `voip_recommendation_actions` últimos 7d.
3. IA recebe `<contexto>` determinístico + pergunta livre, responde em PT-BR ≤6 frases com 1 ação recomendada.
4. UI renderiza markdown + badges-citação clicáveis + histórico.

## Métricas

- **22 edge functions** | **~116 testes Deno** (4 voice-qa + 3 executive-narrative).
- Zero nova tabela; reuso total de Ondas 17/18/19.
- Web Speech API com graceful degradation.

## ADR

`docs/adr/035-onda-20-voice-qa-executive-summary.md`
