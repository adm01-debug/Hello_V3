---
name: Customer Success Suite
description: Suíte completa Gainsight/ChurnZero-like — accounts com health 360°, churn risk com sinais detectáveis, renewals 30/60/90, success plans com marcos, NPS integrado
type: feature
---

Suíte de Customer Success & Retention Intelligence (10/10):

**Tabelas**
- `accounts` (health_score 0-100, churn_risk_score 0-100, segment, MRR/ARR, csm_agent_name, current_stage)
- `churn_risk_signals` (signal_type, severity, score_delta, evidence)
- `renewals` (renewal/expansion/upsell/cross_sell, probability, due_date, status)
- `customer_journey_stages` + `account_journey_history`
- `surveys` + `survey_responses` (NPS/CSAT/CES)
- `success_plans` + `success_plan_milestones`

**Edge Functions**
- `compute-account-health` — score com 5 fatores ponderados (contato 20%, sentimento 25%, NPS 25%, sinais 20%, renovação 10%)
- `detect-churn-risk` — detecção heurística idempotente (contact_drop, negative_sentiment, competitor_mention, objection_pattern)
- `send-survey` — cria stub pendente para tracking de envio

**Hooks**
- `useAccounts` — CRUD + recomputeHealth + detectChurn
- `useChurnRisk` — sinais ativos + resolve com notes
- `useRenewals` — buckets 30/60/90 + totais (pipeline/weighted/won)
- `useSuccessPlans` — plans + milestones agrupados + toggle
- `useSurveys` — responses + sendSurvey + npsScore agregado

**Páginas**
- `/accounts` — carteira filtravel com health/risk badges
- `/renewals` — kanban 30/60/90 com weighted forecast
- `/success-plans` — checklist de marcos com progress

**Dashboard**
- `CustomerSuccessCard` no Executive Dashboard

**RLS**
- Admin/supervisor full access em todas as tabelas
- CSM (role agent) restrito às contas onde é `csm_agent_name`
- Inserções de journey_history e survey_responses validam ownership da conta

**Estágios padrão (seeded)**
onboarding → adoption → value_realization → expansion → renewal → at_risk
