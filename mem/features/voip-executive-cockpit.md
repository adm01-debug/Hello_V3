---
name: VoIP Executive Cockpit
description: Health Score VoIP 0-100 agregado em /network-diagnostics com breakdown SLA/MOS/Alertas/Capacidade e exportação CSV
type: feature
---

Cockpit executivo VoIP no topo de `/network-diagnostics` consolida todos os sinais de qualidade em um único Health Score 0-100.

**Fórmula:** `0.4·SLA + 0.3·MOS_norm + 0.2·Alertas_norm + 0.1·Capacidade_norm`
- SLA = % chamadas com MOS ≥ 4.0 no período
- MOS_norm = (mos - 1) / 4 × 100
- Alertas_norm = 100 - (unack/total × 1000), clamp 0-100
- Capacidade_norm = penaliza acima de 60% do cap (3 simultâneas)

**Faixas:** ≥80 saudável (success) • 60-79 atenção (warning) • <60 crítico (destructive)

**Edge function:** `voip-executive-summary?period=day|week|month` — single-call com `Promise.all` em `call_quality_metrics`, `voip_quality_alerts`, `call_sessions`. JWT obrigatório, 8 testes Deno cobrindo as 4 funções puras de normalização.

**Hook:** `useVoipExecutiveSummary` (React Query, staleTime 5min).

**Componentes:**
- `VoipHealthScoreCard` — hero card com score grande, sparkline (recharts), breakdown dos 4 pilares com pesos, deltas SLA, top 3 piores agentes (24h, mín. 3 chamadas).
- `ExecutiveReportExport` — botão no header gera CSV `voip-executive-{period}-{YYYYMMDD}.csv` reutilizando `src/lib/export`.

ADR-030 documenta a decisão. Zero schema change, reuso total das tabelas existentes.
