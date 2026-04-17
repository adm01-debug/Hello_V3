
Três suítes 10/10 entregues: Conversation Intelligence, Sales Enablement, Customer Success. Próximo gap competitivo: **Workforce Management & Operational Excellence** — domínio de plataformas como NICE, Verint, Calabrio, Five9.

## Plano: Workforce Management & Operational Excellence Suite

### Melhorias sequenciais (1 por vez)

**1. Forecasting de volume de chamadas (IA)**
- Edge function `forecast-call-volume` analisa histórico de `call_sessions` por hora/dia
- Previsão semanal com sazonalidade (Erlang C simplificado)
- Card no Executive Dashboard

**2. Scheduling & Shifts**
- Tabelas `agent_shifts`, `shift_templates`, `time_off_requests`
- Página `/scheduling` com grade semanal drag-friendly
- Aprovação de folgas por supervisor

**3. Adherence em tempo real**
- Edge function `compute-adherence` compara `agent_status_history` vs shift programado
- % aderência por agente/dia + alertas para desvios > 15min
- Widget no `SupervisorPanel`

**4. Skill-based routing**
- Tabelas `skills`, `agent_skills` (proficiência 1-5), `queue_skill_requirements`
- Seleção de agente por melhor match na distribuição
- Página `/skills` para CRUD

**5. Quality Management Workflow**
- Estende scorecards com `qm_review_workflow` (rascunho→revisão→calibração→assinada)
- Calibração: múltiplos avaliadores na mesma chamada + variância
- Dashboard de QM no `/coaching`

**6. Coaching Assignments com SLA**
- Tabela `coaching_assignments` (chamada + agente + supervisor + prazo)
- Notificação automática + tracking de conclusão
- Visível no `CoachingPanel`

**7. Learning Library (microlearning)**
- Tabelas `learning_modules`, `learning_completions`
- Vincular módulos a coaching assignments e badges
- Página `/learning`

**8. ADR 011 + memória + testes**
- `docs/adr/011-workforce-management-suite.md`
- `mem://features/workforce-management.md`
- Testes para `useShifts`, `useAdherence`, `useSkills`

### Considerações técnicas
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, estética cyberpunk neon
- RLS rigoroso: admin/supervisor full, agent só seus próprios shifts/adherence/assignments
- Reuso de `agent_status_history`, `call_sessions`, `call_scorecards`, `agents`
- Heurísticas determinísticas para forecast/adherence (auditáveis); IA só onde agrega
- Sem novas dependências externas

### Ordem de execução
1. Migration: shifts, time_off, skills, qm_workflow, coaching_assignments, learning (+ RLS)
2. Edge functions: forecast-call-volume, compute-adherence
3. Hooks: useShifts, useTimeOff, useAdherence, useSkills, useQMWorkflow, useCoachingAssignments, useLearning
4. Páginas: Scheduling, Skills, Learning + widgets em SupervisorPanel/CoachingPanel
5. Card Forecast volume + Adherence no Executive Dashboard
6. Rotas + CommandPalette
7. Testes + ADR + memória
