# ADR-031 — Onda 16: Recomendações Acionáveis e Playbooks de Remediação VoIP

**Data:** 2026-04-18
**Status:** Aceito
**Contexto:** Após Ondas 1-15, o sistema captura, prediz e exporta sinais VoIP, mas ainda exige interpretação manual do operador para agir.

## Decisão

Introduzir camada de **recomendações priorizadas com 1 clique** que transforma sinais existentes (health score breakdown, alertas, capacidade, qualidade por agente) em ações imediatas.

### Componentes
1. **Edge function `voip-recommendations`** (`?period=day|week`)
   - Agrega `call_quality_metrics` + `voip_quality_alerts` + `call_sessions` em uma única chamada (`Promise.all`).
   - Função pura `buildRecommendations(ctx)` exportada e testada (4 testes Deno).
   - Categorias: `capacity` / `quality` / `infra` / `process`.
   - `action_type`: `link` (rota com hash âncora), `function` (evento global), `acknowledge`.
   - Priorização determinística (score 0-100) — top 5 retornadas.

2. **Hook `useVoipRecommendations`** — React Query, staleTime 2min, retry skip 401/403/404, tracing automático.

3. **Componente `VoipRecommendationsPanel`** em `/network-diagnostics` (abaixo do `VoipHealthScoreCard`)
   - Cards com severidade neon, botão "Aplicar" (1 clique) e "Adiar 24h" (`localStorage`).
   - Empty state amigável quando todos os pilares estão saudáveis.

4. **Bridge frontend** — evento global `voip:run-connectivity-test` permite que recomendações de infra disparem o teste STUN existente sem acoplamento direto.

5. **Âncoras DOM** (`#quality-heatmap`, `#agent-ranking`, `#capacity-forecast`, `#quality-alerts`) habilitam scroll-to-section vindo de links de recomendação.

## Regras de priorização
| Sinal | Threshold | Severidade | Score |
|---|---|---|---|
| Pico ≥ cap (3) | saturado | critical | 95 |
| Pico ≥ 80% cap | atenção | warning | 70 |
| Worst agent MOS < 3.0 | crítico | critical | 90 |
| Worst agent MOS 3.0-3.6 | coaching | warning | 65 |
| Jitter > 50ms | infra crítica | critical | 85 |
| Jitter 30-50ms | infra atenção | warning | 60 |
| Unack alerts ≥ 10 | processo | critical | 80 |
| Unack alerts 3-9 | processo | warning | 50 |
| SLA < 75% | meta crítica | critical | 88 |
| SLA 75-90% | meta atenção | warning | 55 |

## Consequências
**Positivas**
- Loop fechado: detectar → recomendar → aplicar com 1 clique.
- Reuso total das tabelas existentes; zero schema change; zero novas dependências.
- Snooze client-side (`localStorage`) evita poluição de banco.
- Função pura testada garante priorização auditável.

**Negativas**
- Snooze não sincroniza entre dispositivos (aceitável — preferência local).
- Limite fixo de 5 recomendações pode esconder cauda longa (mitigado por scoring determinístico).

## Métricas
- **+4 testes Deno** → total **93 testes em 17 edge functions**.
- 1 nova edge function, 1 hook, 1 componente, 5 âncoras DOM.
- Arquivos ≤400 linhas; tokens semânticos exclusivos; PT-BR.
