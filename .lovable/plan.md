
Status: Ondas 1-12 entregues. Sistema 10/10 com loop completo: monitoramento reativo, diagnóstico, predição, persistência de alertas e auto-remediação guiada. Não restam itens dos roadmaps aprovados.

Para continuar evoluindo com excelência sem refactor especulativo, proponho **Onda 13 — Inteligência Executiva e Drill-Down de Qualidade VoIP**: transformar os dados já capturados (`call_quality_metrics` + `voip_quality_alerts`) em insights acionáveis para gestão.

## Onda 13 — Heatmap, Drill-Down por Agente e Notificações Persistentes

### 13.1 Heatmap de qualidade por hora/dia
`src/components/network/QualityHeatmap.tsx` em `/network-diagnostics`:
- Grid 7 dias × 24 horas (ou 7×6 buckets de 4h em mobile)
- Cor por bucket = MOS médio (verde ≥4.0, amarelo 3.5-4.0, vermelho <3.5)
- Tooltip: nº chamadas, MOS médio, jitter p95
- Dados via novo endpoint `voip-quality-heatmap` (período: 7 dias)

### 13.2 Edge function `voip-quality-heatmap`
- `GET ?days=7` — agrega `call_quality_metrics` por `(dow, hour)`
- Retorna matriz 7×24 com `{mos_avg, count, jitter_p95}`
- JWT, CORS centralizado, validação, `x-request-id`, 4 testes Deno

### 13.3 Drill-down por agente
`src/components/network/AgentQualityRanking.tsx`:
- Tabela: agente, total chamadas (24h), MOS médio, alertas disparados, % SLA
- Ordenável por cada coluna; badge para piores performers
- Apenas admin/supervisor (já protegido pela rota)
- Reuso de `voip-quality-alerts-summary` + nova query a `call_quality_metrics`

### 13.4 Notificações persistentes via central de alertas
Integrar `voip_quality_alerts` ao `NotificationCenter.tsx` (sistema omnichannel já existente):
- Novo tipo `voip_quality` no dropdown do header
- Badge com contador de não-reconhecidos
- Click → navega para `/network-diagnostics` com filtro pré-aplicado
- Realtime via `postgres_changes` na tabela `voip_quality_alerts`

### 13.5 Documentação
- ADR-028 (`docs/adr/028-onda-13-inteligencia-executiva-voip.md`)
- `mem/features/voip-executive-intelligence.md` + atualizar `mem/index.md`
- Atualizar `docs/audit/scorecard-final.md` (re-verificação Onda 13)

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Reuso total das tabelas/edge functions; sem novas dependências
- Zero breakage; RLS de `call_quality_metrics` e `voip_quality_alerts` já garante isolamento
- Sem alterações de schema (apenas leitura agregada)

### Ordem
1. 13.2 Edge function `voip-quality-heatmap` + 4 testes
2. 13.1 Componente `QualityHeatmap` integrado em `/network-diagnostics`
3. 13.3 `AgentQualityRanking` integrado em `/network-diagnostics`
4. 13.4 Integração realtime em `NotificationCenter`
5. 13.5 ADR-028 + memória + scorecard
