# ADR-035 — Onda 20: Voice Q&A Conversacional + Resumo Executivo Auto-Narrado

**Status:** Aceito
**Data:** 2026-04-18
**Contexto:** Onda 19 entregou o ciclo preditivo (simulação what-if + proatividade). Faltava interação humana natural (perguntar em PT-BR sobre o estado VoIP) e relatórios prontos para liderança não-técnica.

## Decisão

Adicionar duas edge functions baseadas em Lovable AI Gateway (`google/gemini-2.5-flash`) sem novas tabelas, com agregação determinística do contexto antes da chamada à IA.

### 1. `voip-diagnostic-voice-qa`
- `POST { question: string(5-500), period?: 'day'|'week'|'month' }`.
- Agrega: `call_quality_metrics` (MOS médio, piores agentes), `voip_quality_alerts` (críticos/unack), `voip_recommendation_actions` (top categorias aplicadas).
- Monta bloco `<contexto>...</contexto>` e envia ao gateway com system prompt PT-BR especialista em VoIP.
- Retorna `{ answer, citations[], confidence (high|medium|low por nº amostras), contextSize, requestId }`.
- 4 testes Deno: auth, validação question/period, OPTIONS/CORS.

### 2. `voip-executive-narrative`
- `POST { period: 'week'|'month', format?: 'markdown'|'plain' }`.
- KPIs: MOS médio, total chamadas, alertas (totais + críticos), ações aplicadas, effectiveness%.
- Top 3 categorias aplicadas + heurística de `pendingHints` (snoozed, dismissed, MOS baixo, alertas críticos).
- IA gera narrativa ≤400 palavras com estrutura fixa (visão geral, positivos, riscos, próximos passos).
- 3 testes Deno: auth, validação period, OPTIONS/CORS.
- **Naming:** `voip-executive-narrative` (não `voip-executive-summary` — esse já existe na Onda 15 com Health Score).

### 3. UI
- `VoipVoiceQAPanel`: input + microfone (Web Speech API com graceful degradation), 4 sugestões rápidas, render markdown, citações clicáveis (`scrollIntoView` em `#quality-heatmap`, `#agent-ranking`, `#quality-alerts`), histórico das últimas 5 perguntas em `localStorage` (`voip-voiceqa-history`).
- `ExecutiveSummaryDialog`: botão no header `/network-diagnostics`, seletor week/month, KPIs em grid, narrativa markdown, CTA "Copiar" e "PDF" (jsPDF), regenerar manual.

### 4. Hooks
- `useVoipDiagnosticVoiceQA`: `useMutation`, sem cache.
- `useVoipExecutiveNarrative(period, enabled)`: `useQuery` lazy (só busca quando dialog abre), `staleTime: 10min`.

## Consequências

**Positivas:**
- Fechamento do loop 360° com **interação natural**: perguntar → entender → agir → reportar.
- Liderança recebe narrativa pronta em <2s com 1 clique.
- Citações clicáveis criam "deep link" entre IA e seções operacionais.
- Reuso total das tabelas das Ondas 17/18/19; zero nova tabela.

**Trade-offs:**
- Web Speech API só funciona em navegadores modernos (Chrome/Edge); fallback texto cobre o resto.
- IA pode variar texto entre regenerações — mitigado por system prompt rígido com estrutura obrigatória.
- Custo de IA: cada Q&A e cada resumo = 1 chamada Lovable AI; staleTime 10min evita repetições.

## Métricas

- **22 edge functions** no total (20 anteriores + 2 novas).
- **~116 testes Deno** (109 anteriores + 7 novos: 4 voice-qa + 3 executive-narrative).
- **Limite de palavras** garantido por system prompt (≤400).

## Loop completo (Ondas 9→20)

`detectar (9) → monitorar (10) → SLA (11) → auto-remediar (12) → ranking (13) → forecast (14) → cockpit (15) → recomendar (16) → auto-aplicar+histórico (17) → coachear+insights (18) → simular+proatividade (19) → conversar+resumir (20)`
