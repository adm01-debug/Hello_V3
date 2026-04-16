
Conversation Intelligence ✅ 10/10 e Sales Enablement ✅ 10/10 entregues. Próximo gap competitivo identificado: **Customer Success & Retention Intelligence** — domínio onde plataformas como Gainsight, ChurnZero e Totango operam.

## Plano: Customer Success & Retention Intelligence Suite

### Melhorias sequenciais (1 por vez)

**1. Account Health Score 360°**
- Tabela `accounts` (cliente pós-venda, separado de `deals` ganhos)
- Edge function `compute-account-health`: agrega frequência de contato, sentimento médio, NPS, tickets abertos, uso (se disponível)
- Score 0-100 com fatores explicáveis

**2. Churn Risk Detection**
- Edge function `detect-churn-risk` analisa sinais: queda de contato, sentimento negativo, menções de concorrente, objeções recorrentes
- Tabela `churn_risk_signals` persiste alertas
- Notificação automática para CSM quando risco > 70

**3. Renewal & Expansion Pipeline**
- Tabela `renewals` (data, valor MRR/ARR, status, probabilidade)
- Página `/renewals` com timeline 30/60/90 dias
- Card no Executive Dashboard

**4. Customer Journey Stages**
- Tabela `customer_journey_stages` configurável (onboarding/adoção/expansão/renovação)
- Movimentação automática baseada em eventos + manual
- Visualização funil no dashboard

**5. NPS & CSAT Surveys integrado**
- Tabela `surveys` + `survey_responses`
- Edge function envia survey pós-chamada (in-app/WhatsApp via Wavoip)
- Agregação automática em account health

**6. Success Plans (planos de sucesso por cliente)**
- Tabela `success_plans` + `success_plan_milestones`
- CSM define metas, prazos e marcos por conta
- Acompanhamento visual com progresso

**7. Página Accounts + integração com Contacts**
- `/accounts` com listagem, filtros por health/risco/segmento
- Detalhe da conta agrega: contatos, deals, chamadas, tickets, surveys
- Reuso do `NeonPageLayout`

**8. ADR 010 + memória + testes**
- `docs/adr/010-customer-success-suite.md`
- `mem://features/customer-success.md`
- Testes para hooks novos (useAccounts, useChurnRisk, useRenewals)

### Considerações técnicas
- ≤400 linhas/arquivo, PT-BR, logger central, sonner
- Estética cyberpunk neon mantida
- RLS: admin/supervisor full; CSM (role agent) só suas contas
- Reuso de `call_sessions`, `call_summaries`, `live_sentiment_snapshots` para sinais
- Lovable AI (gemini-2.5-flash) só onde agrega valor (detecção de risco)
- Heurísticas determinísticas para health/renewal (auditável, sem custo recorrente)
- Sem novas dependências externas

### Ordem de execução
1. Migration: accounts, churn_risk_signals, renewals, customer_journey_stages, surveys, success_plans (+ RLS)
2. Edge functions: compute-account-health, detect-churn-risk, send-survey
3. Hooks: useAccounts, useChurnRisk, useRenewals, useSuccessPlans, useSurveys
4. Páginas: Accounts, Renewals, SuccessPlans
5. Cards no Executive Dashboard (Renewal pipeline + Churn risk)
6. Rotas + CommandPalette
7. Testes + ADR + memória
