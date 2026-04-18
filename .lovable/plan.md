
Onda 20 entregue. Proponho **Onda 21 — Anomaly Detection Estatística + Auto-Remediação Confiável** para fechar o ciclo com detecção proativa não-supervisionada e ações automáticas seguras.

## Onda 21 — Statistical Anomaly Detection + Trusted Auto-Remediation

### 1. Edge function `voip-anomaly-detector`
- `GET ?period=day|week` — analisa `call_quality_metrics` últimos 7-30d
- Calcula baseline (média móvel + desvio padrão) por hora-do-dia para MOS, jitter, packet loss
- Detecta anomalias via z-score (|z| > 2.5) e mudanças bruscas (>20% vs baseline)
- Classifica: `spike` (pico isolado), `drift` (tendência sustentada), `outage` (queda crítica)
- Retorna `{ anomalies[], baseline, requestId }`
- JWT + CORS + 4 testes Deno

### 2. Edge function `voip-auto-remediation`
- `POST { anomalyId, dryRun?: boolean }`
- Mapeia anomalia → ação segura pré-aprovada (ex.: reduzir codec, pausar campanhas, alertar equipe)
- **Whitelist rígida** de ações permitidas (sem ações destrutivas)
- Registra em `voip_recommendation_actions` com `outcome: 'auto_applied'` e `notes` da anomalia
- Idempotência via `anomalyId` (não re-executa em 1h)
- 3 testes Deno (auth, dry-run, idempotência)

### 3. Hooks
- `useVoipAnomalies` (query, staleTime 2min)
- `useVoipAutoRemediation` (mutation)

### 4. Componente `AnomalyDetectionCard`
- Card glass-card em `/network-diagnostics` (acima do `RecommendationInsightsCard`)
- Lista anomalias ativas com badge severidade + tipo (spike/drift/outage)
- Mini sparkline (recharts) mostrando série temporal + linha baseline + ponto anômalo destacado
- Por anomalia: botão "Aplicar remediação" (com modal de confirmação) + "Dispensar"
- Toggle "Auto-remediação ativa" (pref `localStorage`) — quando ativo, dispara remediação automática para anomalias `outage`

### 5. Documentação
- ADR-036 em `docs/adr/036-onda-21-anomaly-detection-auto-remediation.md`
- `mem/features/voip-anomaly-detection.md` + atualizar `mem/index.md`
- Atualizar `docs/audit/scorecard-final.md` (24 edge functions, ~123 testes Deno)

## Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Zero novas tabelas; reuso de `call_quality_metrics` + `voip_recommendation_actions`
- Detecção 100% determinística (estatística pura, sem IA) → reproduzível e auditável
- Auto-remediação com whitelist rígida + idempotência → zero risco de loop
- Loop final: detectar (estatística) → classificar → remediar (whitelist) → registrar → coachear

## Ordem de execução
1. Edge function `voip-anomaly-detector` + 4 testes
2. Edge function `voip-auto-remediation` + 3 testes
3. Hooks `useVoipAnomalies` + `useVoipAutoRemediation`
4. `AnomalyDetectionCard` integrado em `/network-diagnostics`
5. ADR-036 + memória + scorecard
