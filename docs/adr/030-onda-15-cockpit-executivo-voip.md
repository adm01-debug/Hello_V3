# ADR-030: Cockpit Executivo VoIP e Health Score Consolidado

**Status:** Accepted
**Date:** 2026-04-18
**Wave:** 15

## Contexto

Após Ondas 1-14 entregarem o loop completo de monitoramento, predição, persistência, auto-remediação, heatmap, drill-down, anomalias e forecast, ainda faltava uma visão executiva única que respondesse "como está a saúde VoIP agora?" em uma métrica.

## Decisão

Criar um **Health Score 0-100** agregado em uma única edge function (`voip-executive-summary`) consumido por componente hero (`VoipHealthScoreCard`) no topo de `/network-diagnostics` e exportável via CSV (`ExecutiveReportExport`).

### Fórmula
```
Health = 0.4·SLA + 0.3·MOS_norm + 0.2·Alertas_norm + 0.1·Capacidade_norm
```
- **SLA** (40%): % de chamadas com MOS ≥ 4.0 no período
- **MOS** (30%): MOS médio normalizado linearmente para 0-100 (1→0, 5→100)
- **Alertas** (20%): penalidade proporcional a alertas não-reconhecidos / total chamadas
- **Capacidade** (10%): penalidade quando pico simultâneo se aproxima do cap (3)

### Faixas semânticas
- ≥80 → SAUDÁVEL (success)
- 60-79 → ATENÇÃO (warning)
- <60 → CRÍTICO (destructive)

## Implementação

- **Edge:** `supabase/functions/voip-executive-summary/index.ts` — single-call agregada com 3 queries paralelas (`Promise.all`) sobre `call_quality_metrics`, `voip_quality_alerts`, `call_sessions`. JWT obrigatório, CORS centralizado, validação `oneOf('day','week','month')`.
- **Funções puras exportadas para testes:** `computeHealthScore`, `normalizeMos`, `normalizeAlerts`, `normalizeCapacity`.
- **Hook:** `useVoipExecutiveSummary` (React Query, staleTime 5min, retry skip 401/403/404, `traceHeaders()`).
- **Componente hero:** `VoipHealthScoreCard` — score grande, badge semântico, sparkline (recharts), breakdown dos 4 pilares com pesos visíveis, deltas SLA, top 3 piores agentes.
- **Exportação:** `ExecutiveReportExport` reutiliza `src/lib/export` (CSV com BOM UTF-8) → `voip-executive-{period}-{YYYYMMDD}.csv`.

## Testes

8 testes Deno cobrindo:
- Health score perfeito = 100
- Fórmula ponderada (caso conhecido 60)
- `normalizeMos(null)` neutro (75)
- `normalizeMos(4.0)` ≈ 75
- `normalizeAlerts(0,0)` = 100
- `normalizeAlerts(10,100)` = 0 (10% unack zera)
- `normalizeCapacity(1)` = 100
- `normalizeCapacity(3)` ≤ 30

Total acumulado: **89 testes Deno** em **16 edge functions VoIP/diagnóstico**.

## Consequências

✅ Resposta executiva em uma única métrica
✅ Single-call agregada → menos round-trips no dashboard
✅ Exportação direta para gestão sem dependências externas
✅ Reuso total de tabelas existentes (zero schema change)
✅ Fórmula documentada e testada (auditável)

## Arquivos

- `supabase/functions/voip-executive-summary/index.ts`
- `supabase/functions/voip-executive-summary/__tests__/index.test.ts`
- `src/hooks/useVoipExecutiveSummary.ts`
- `src/components/network/VoipHealthScoreCard.tsx`
- `src/components/network/ExecutiveReportExport.tsx`
- `src/pages/NetworkDiagnostics.tsx` (integração)
