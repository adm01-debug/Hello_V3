# ADR-027: Onda 12 — Auto-Remediação e Alertas Persistentes VoIP

**Status:** Accepted
**Data:** 2026-04-17

## Contexto
Após a Onda 11, a detecção preditiva de degradação emitia apenas toast efêmero. Faltava (a) histórico auditável de incidentes de qualidade e (b) caminho claro de remediação para o usuário.

## Decisão
- **Tabela `voip_quality_alerts`** com RLS isolando por agente (admin/supervisor veem todos). Índices em `(created_at DESC, user_id)` e parcial em alertas não reconhecidos.
- **`useQualityTrendAnalyzer`** estendido para persistir alertas (best-effort, não bloqueia UX) e disparar callback `onSevereDegradation` quando slope ≤ -0.15 e MOS < 3.5.
- **`useVoipAutoRemediation`** — sugere reconexão SIP via toast com action button. Throttled a 1 sugestão / 30s. Nunca executa ação destrutiva sem confirmação.
- **`QualityAlertsCard`** em `/network-diagnostics`: lista 20 últimos, filtro por tipo, badge de não-reconhecidos, "Marcar todos como lidos".
- **Edge function `voip-quality-alerts-summary`** — agrega contagem por tipo, top 5 usuários, MOS médio nos alertas. JWT obrigatório, CORS centralizado, 4 testes Deno.

## Consequências
- Operações ganham visibilidade histórica de qualidade por usuário.
- Usuário tem ação concreta ao receber alerta crítico (reconectar / encerrar).
- +1 tabela, +2 hooks, +1 componente, +1 edge function (4 testes). Total: **69 testes em 11 Edge Functions**.
- Zero novas dependências; todos os arquivos ≤400 linhas.

## Alternativas descartadas
- Auto-reconexão silenciosa: rejeitada — pode interromper chamada em andamento sem consentimento.
- Renegociação de codec automática: complexidade alta vs ganho marginal; reconexão completa é mais robusta.
