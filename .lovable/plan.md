
Status: Ondas 1-10 entregues. Sistema 10/10 com monitoramento completo de rede e VoIP, página `/network-diagnostics`, integração automática do `useVoipQualityMonitor` no `useSipCall`, badges no header de `/calls`.

Não restam itens dos roadmaps aprovados. Para manter excelência sem refactor especulativo, proponho **Onda 11 — Inteligência Preditiva de Qualidade VoIP**: alertas proativos baseados em tendências e dashboard executivo de SLA de rede.

## Onda 11 — Inteligência Preditiva de Qualidade VoIP

### 11.1 Detecção de degradação progressiva
Hook `src/hooks/useQualityTrendAnalyzer.ts`:
- Analisa últimas 5 amostras de MOS em chamada ativa
- Detecta tendência descendente (regressão linear simples)
- Emite evento `quality:degrading` antes de atingir nível "poor"
- Toast preventivo via sonner: "Qualidade da chamada degradando — verifique sua rede"

### 11.2 Edge function de agregação SLA
`supabase/functions/voip-sla-report/index.ts`:
- Agrega `call_quality_metrics` por dia/semana/mês
- Retorna SLA % (chamadas com MOS ≥ 4.0), MOS médio, p95 de jitter/RTT
- JWT verificado, CORS centralizado, validação Zod, tracing `x-request-id`
- 6 testes Deno em `__tests__/index.test.ts`

### 11.3 Card SLA no `/network-diagnostics`
Adicionar à página existente:
- Card "SLA dos últimos 7 dias" (gauge circular + %)
- Card "p95 jitter / p95 RTT" (valores + comparação com semana anterior)
- Botão "Exportar relatório SLA (CSV)"

### 11.4 Migration: índice de performance
- Índice `call_quality_metrics(created_at DESC, mos_avg)` para acelerar agregações SLA

### 11.5 Documentação
- ADR-026 (`docs/adr/026-onda-11-inteligencia-preditiva-voip.md`)
- `mem/features/voip-predictive-quality.md` + atualização do `mem/index.md`
- Atualizar `docs/audit/scorecard-final.md`

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Reuso total da tabela `call_quality_metrics`; sem novas dependências
- Zero breakage; RLS já garante isolamento por papel

### Ordem
1. 11.4 Migration de índice
2. 11.2 Edge function `voip-sla-report` + testes
3. 11.1 Hook `useQualityTrendAnalyzer` + integração no `useSipCall`
4. 11.3 Cards SLA no `/network-diagnostics` + export CSV
5. 11.5 ADR-026 + memórias + scorecard
