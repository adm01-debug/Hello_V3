name: Project Memory

## Core
PT-BR em toda UI/comunicação. Estética cyberpunk neon (glassmorphism, glow). Tokens semânticos sempre, nunca cores hardcoded.
Lovable Cloud (Supabase) backend; auth obrigatória; RLS rigorosa em todas as tabelas.
Logger central (`src/lib/logger`) — nunca console.log em produção. Sonner para toasts.
Edge functions: usar `_shared/cors.ts` e validar JWT em código. ≤400 linhas/arquivo.
Suítes 10/10 entregues: Conversation Intelligence, Sales Enablement, Customer Success, Workforce Management, Omnichannel Engagement, Meeting Summary AI, **Real-Time Agent Assist (ADR-013)**.

## Memories
- [Real-Time Agent Assist](mem://features/agent-assist) — Copiloto in-call estilo Cresta/Balto: signals ao vivo, objection library, compliance guardrails, auto-fill CRM (ADR-013)
- [Meeting Summary AI](mem://features/meeting-summary-ai) — Notas executivas pós-call automáticas via Lovable AI com tool calling, ações/decisões/sentimento/follow-up
- [Workforce Management](mem://features/workforce-management) — Forecast Erlang C, escala/turnos, aderência tempo real, skills 1-5, coaching SLA, microlearning
- [Customer Success](mem://features/customer-success) — Accounts com health 360°, churn risk detection, renewals 30/60/90, success plans, NPS
- [Sales Enablement](mem://features/sales-enablement) — Deals com health IA, forecast, cadências, scorecards, trackers, playlists
- [Conversation Intelligence](mem://features/conversation-intelligence) — Talk ratio, key moments, battle cards, biblioteca searchable, coaching timeline
