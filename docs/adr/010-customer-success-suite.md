# ADR 010 — Customer Success & Retention Intelligence Suite

## Status
Aceito — 2026-04-16

## Contexto
A plataforma cobria pré-venda (Conversation Intelligence) e revenue (Sales Enablement). Faltava capacidade de **pós-venda**: gerenciar saúde de clientes, prevenir churn, organizar renovações e planos de sucesso — domínio de Gainsight, ChurnZero e Totango.

## Decisão
Implementar suíte completa de Customer Success com:

### Tabelas
- `accounts` — clientes pós-venda (separado de `deals`), com health score 0-100, churn risk 0-100, segmento, MRR/ARR, CSM responsável
- `churn_risk_signals` — sinais individuais detectados (contact_drop, negative_sentiment, competitor_mention, objection_pattern), cada um com `score_delta` que soma ao `churn_risk_score`
- `renewals` — pipeline de renovações e expansões com probabilidade e janela 30/60/90
- `customer_journey_stages` + `account_journey_history` — estágios configuráveis (onboarding → renewal → at_risk) com histórico de movimentação
- `surveys` + `survey_responses` — NPS/CSAT/CES com agregação automática
- `success_plans` + `success_plan_milestones` — planos com objetivo, target_date e marcos checáveis

### Edge Functions
- `compute-account-health` — score determinístico com pesos: contato (20%) + sentimento (25%) + NPS (25%) + sinais ativos (20%) + proximidade renovação (10%)
- `detect-churn-risk` — heurísticas auditáveis sobre `call_sessions`, `call_summaries`, `call_key_moments`; persiste apenas sinais novos (idempotente)
- `send-survey` — cria registro pendente em `survey_responses` para tracking; entrega de canal (in-app/WhatsApp) extensível

### RLS
- Admin/supervisor têm acesso total
- CSM (role agent) só vê e edita contas onde é `csm_agent_name`
- Survey responses inseríveis apenas por admin/supervisor ou CSM da conta vinculada

### Frontend
- `/accounts` — carteira com filtros health/risco/status
- `/renewals` — kanban 30/60/90 com weighted forecast
- `/success-plans` — planos com checklist de marcos
- `CustomerSuccessCard` no Executive Dashboard

## Alternativas consideradas
1. **IA generativa para health score** — rejeitado: heurística determinística é auditável, sem custo recorrente, explicável ao cliente
2. **Tabela `tickets` integrada** — adiado: integrar via webhook quando ticketing (Zendesk/Intercom) for conectado
3. **Reutilizar `deals` para renewals** — rejeitado: lifecycle e métricas distintas (MRR vs deal value, due_date vs close_date)

## Consequências
**Positivas**
- Visibilidade end-to-end: pré-venda → fechamento → expansão → renovação
- Detecção proativa de churn antes da renovação
- Reuso de sinais já capturados (sentimento, key moments)

**Negativas / mitigações**
- Heurísticas precisam ser tunadas após dados reais — pesos no código permitem ajuste rápido
- NPS depende de envio efetivo de surveys — `send-survey` cria stub para tracking; integração de canal extensível
