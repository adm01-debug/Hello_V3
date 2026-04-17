---
name: workforce-management
description: Suíte 10/10 estilo NICE/Verint/Calabrio — forecast Erlang C, escalas, aderência tempo real, skill-based routing, QM workflow, coaching assignments com SLA, microlearning
type: feature
---

# Workforce Management & Operational Excellence Suite

ADR 011 — implementação completa em paralelo com Conversation Intelligence (008), Sales Enablement (009) e Customer Success (010).

## Tabelas (9)
- `shift_templates` — modelos reutilizáveis de turno (horário, dias, intervalo)
- `agent_shifts` — turnos atribuídos com status (scheduled/in_progress/completed/missed)
- `time_off_requests` — folgas com fluxo aprovação (pending/approved/rejected)
- `skills` — catálogo (idioma, produto, técnico, soft skills)
- `agent_skills` — proficiência 1-5 por agente×skill (UNIQUE composto)
- `queue_skill_requirements` — requisitos por fila com peso (weight) e min_proficiency
- `coaching_assignments` — tarefas de coaching com prazo/SLA + agent_response
- `learning_modules` — biblioteca microlearning (article/video/quiz/interactive)
- `learning_completions` — registro por agente×módulo (UNIQUE composto)

## Edge Functions (2)
- `forecast-call-volume` — analisa últimos 28 dias de `call_sessions`, agrega por dia×hora, aplica Erlang C simplificado (AHT 240s, SL 80%) → retorna grid 7×24 com expected_calls + required_agents + summary (avg_daily, peak_hour, total_required_agent_hours)
- `compute-adherence` — compara `agent_status_history` vs `agent_shifts` programados → % aderência por agente/dia + lista de desvios (away_too_long > 15min)

## Hooks (7)
- `useShifts(weekStart)` — CRUD turnos + templates filtrado por semana
- `useTimeOff()` — solicitações + aprovação supervisor
- `useAdherence(date)` — invoca edge function (refetch 60s)
- `useSkills()` — catálogo + matriz proficiência + upsert por (agent,skill)
- `useCoachingAssignments()` — atribuir, marcar concluído, listar
- `useLearning()` — módulos ativos + completions + markComplete (upsert)
- `useForecastVolume()` — invoca edge function (staleTime 30min)

## Páginas (3)
- `/scheduling` — Tabs: grade semanal 7 colunas, time-off requests com aprovação, templates
- `/skills` — Tabs: catálogo agrupado por categoria, matriz agente×skill (1-5)
- `/learning` — biblioteca agrupada por categoria, badge de "concluído" por agente

## Integração no Executive Dashboard
- `VolumeForecastCard.tsx` — heatmap 7×24 + KPIs (média diária, hora de pico, hr-agente/semana)

## Acesso (RLS)
- Admin/supervisor: full access em todas as tabelas
- Agent: vê apenas seus shifts/time_off/coaching_assignments/learning_completions
- Catálogos (skills, templates, learning_modules) visíveis a todos autenticados
- Agente pode criar próprias time_off_requests e learning_completions; pode marcar coaching_assignments como concluído (próprio)

## Testes
- `useShifts.test.ts`, `useAdherence.test.ts`, `useSkills.test.ts`

## Heurísticas (sem custo de IA)
- Forecast: divide volume histórico por 4 semanas, Erlang C com AHT/SL fixos
- Adherence: estados available/busy contam; away > 15min é desvio
- Skill match: `weight × proficiency` ordenado descendente

## Arquivos chave
- supabase/migrations/<timestamp>_workforce_management.sql
- supabase/functions/forecast-call-volume/index.ts
- supabase/functions/compute-adherence/index.ts
- src/hooks/useShifts.ts, useTimeOff.ts, useAdherence.ts, useSkills.ts, useCoachingAssignments.ts, useLearning.ts, useForecastVolume.ts
- src/pages/Scheduling.tsx, Skills.tsx, Learning.tsx
- src/components/executive/VolumeForecastCard.tsx
- docs/adr/011-workforce-management-suite.md
