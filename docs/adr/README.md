# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the Promo Brindes call center system.

> Índice regenerado em 2026-11-22 a partir dos arquivos do diretório (antes listava só 001–007 de 53).
> Observações conhecidas: **ADR-045 não existe** (lacuna 044 → 046, documentada em `docs/estado/funcionalidades-planejadas.md`) e há **dois ADR-012**.

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](001-supabase-cloud-backend.md) | ADR-001: Supabase as Backend via Lovable Cloud | Accepted |  |
| [002](002-rbac-separate-roles-table.md) | ADR-002: RBAC with Separate Roles Table | Accepted |  |
| [003](003-security-definer-functions.md) | ADR-003: SECURITY DEFINER for RLS Helper Functions | Accepted |  |
| [004](004-modular-auth-architecture.md) | ADR-004: Modular Authentication Architecture | Accepted |  |
| [005](005-edge-function-cors-validation.md) | ADR-005: Origin-Validated CORS in Edge Functions | Accepted |  |
| [006](006-centralized-logging.md) | ADR-006: Centralized Structured Logger with Request ID | Accepted |  |
| [007](007-lazy-routing-code-splitting.md) | ADR-007: Lazy Routing and Bundle Code Splitting | Accepted |  |
| [008](008-conversation-intelligence.md) | ADR 008 — Conversation Intelligence (estilo Gong/Chorus) | Aceito |  |
| [009](009-sales-enablement-suite.md) | ADR 009 — Sales Enablement & Revenue Intelligence Suite | Aceito | 2026-04-16 |
| [010](010-customer-success-suite.md) | ADR 010 — Customer Success & Retention Intelligence Suite | Aceito |  |
| [011](011-workforce-management-suite.md) | ADR 011 — Workforce Management & Operational Excellence Suite | Aceito | 2026-04-17 |
| [012](012-meeting-summary-ai.md) | ADR 012: Meeting Summary AI (Notas Executivas Pós-Call) | Aceito |  |
| [012](012-omnichannel-suite.md) | ADR 012 — Suíte Omnichannel (Inbox, Knowledge Base, Roteamento, SLA, Chatbot) | Aceito | 2026-04-17 |
| [013](013-real-time-agent-assist.md) | ADR 013 — Real-Time Agent Assist & Next-Best-Action | Aceito | 2026-04-17 |
| [014](014-voice-biometrics-fraud.md) | ADR-014: Voice Biometrics & Fraud Detection | Aceito |  |
| [015](015-outbound-compliance-predictive.md) | ADR 015 — Outbound Compliance & Predictive Engagement Suite | Aceito | 2026-04-17 |
| [016](016-multilingual-translation.md) | ADR-016: Multilingual Real-Time Translation & Localization Suite | Aceito |  |
| [017](017-security-hardening-and-roadmap-10-10.md) | ADR-017: Security Hardening + Roadmap rumo ao 10/10 | Accepted |  |
| [018](018-onda-3-refactor-rls-tracing.md) | ADR-018 — Onda 3: Refatoração, Testes RLS e Tracing Aplicado | Aceito | 2026-04-17 |
| [019](019-onda-4-fechamento-10-10.md) | ADR-019 — Onda 4: Fechamento 10/10 | Aceito | 2026-04-17 |
| [020](020-onda-5-polimento.md) | ADR-020 — Onda 5: Polimento Pós-10/10 | Aceito | 2026-04-17 |
| [021](021-onda-6-hardening-final.md) | ADR-021 — Onda 6: Hardening Final pós-10/10 | Aceito | 2026-04-17 |
| [022](022-onda-7-manutencao-continua.md) | ADR-022 — Onda 7: Manutenção Contínua | Aceito | 2026-04-17 |
| [023](023-onda-8-resiliencia-operacional.md) | ADR-023: Onda 8 — Resiliência Operacional | Accepted | 2026-04-17 |
| [024](024-onda-9-monitoramento-voip.md) | ADR-024 — Onda 9: Monitoramento de Rede e Qualidade VoIP | Aceito | 2026-04-17 |
| [025](025-onda-10-diagnostico-rede.md) | ADR-025 — Onda 10: Diagnóstico de Rede & VoIP | Aceito | 2026-04-17 |
| [026](026-onda-11-inteligencia-preditiva-voip.md) | ADR-026 — Onda 11: Inteligência Preditiva de Qualidade VoIP | Aceito | 2026-04-17 |
| [027](027-onda-12-auto-remediacao-voip.md) | ADR-027: Onda 12 — Auto-Remediação e Alertas Persistentes VoIP | Accepted | 2026-04-17 |
| [028](028-onda-13-inteligencia-executiva-voip.md) | ADR-028: Onda 13 — Inteligência Executiva e Drill-Down VoIP | Accepted |  |
| [029](029-onda-14-anomaly-detection-forecast.md) | ADR-029: Onda 14 — Detecção de Anomalias e Forecast de Capacidade VoIP | Aceito | 2026-04-17 |
| [030](030-onda-15-cockpit-executivo-voip.md) | ADR-030: Cockpit Executivo VoIP e Health Score Consolidado | Accepted |  |
| [031](031-onda-16-recomendacoes-acionaveis-voip.md) | ADR-031 — Onda 16: Recomendações Acionáveis e Playbooks de Remediação VoIP | Aceito | 2026-04-18 |
| [032](032-onda-17-auto-apply-historico-recomendacoes.md) | ADR-032 — Onda 17: Auto-Apply Programado e Histórico Auditável de Recomendações VoIP | Aceito | 2026-04-18 |
| [033](033-onda-18-coaching-insights-recomendacoes.md) | ADR-033 — Onda 18: Coaching inteligente pós-ação + insights preditivos de recomendações VoIP | Aceito | 2026-04-18 |
| [034](034-onda-19-whatif-simulator-proactive.md) | ADR-034 — Onda 19: What-If Simulator + Recomendações Proativas Agendadas | Aceito |  |
| [035](035-onda-20-voice-qa-executive-summary.md) | ADR-035 — Onda 20: Voice Q&A Conversacional + Resumo Executivo Auto-Narrado | Aceito | 2026-04-18 |
| [036](036-onda-21-anomaly-detection-auto-remediation.md) | ADR-036: Onda 21 — Detecção de Anomalias Estatística + Auto-Remediação Confiável | Accepted | 2026-04-18 |
| [037](037-onda-22-quality-forecasting.md) | ADR-037 — Onda 22: Forecasting Preditivo de Qualidade VoIP + Capacity Planning | Accepted | 2026-04-18 |
| [038](038-onda-23-rls-hardening-hibp.md) | ADR-038: Onda 23 — RLS Hardening Final + HIBP + Type Safety | Accepted |  |
| [039](039-onda-24-25-locking-coverage.md) | ADR-039 — Onda 24/25: Optimistic Locking + CI Coverage Gate | Aceito | 2026-04-18 |
| [040](040-onda-26-locking-expandido.md) | ADR-040 — Onda 26: Optimistic Locking expandido + Testes defensivos | Aceito | 2026-04-18 |
| [041](041-onda-27-cobertura-defensiva.md) | ADR-041 — Onda 27: Cobertura Defensiva Final do Optimistic Locking | Aceito | 2026-04-18 |
| [042](042-onda-28-blindagem-concorrencia.md) | ADR-042 — Onda 28: Blindagem de Concorrência Final | Aceito | 2026-04-18 |
| [043](043-onda-29-observabilidade-conflitos.md) | ADR-043 — Onda 29: Observabilidade de Conflitos + Retenção Automática | Aceito | 2026-04-18 |
| [044](044-onda-30-cron-hotspot-alerts.md) | ADR-044 — Onda 30: Cron Automatizado + Alertas de Hotspot | Aceito | 2026-04-18 |
| [046](046-onda-32-sip-config-healthcheck.md) | ADR-046 — Onda 32: Refactor sip-config + Health Check periódico de Trunks VoIP | Aceito | 2026-04-18 |
| [047](047-onda-33-failover-trunks.md) | ADR-047 — Onda 33: Failover automático e métricas de uso por trunk VoIP | Aceito | 2026-04-18 |
| [048](048-onda-34-painel-unificado-ramais.md) | ADR-048 — Onda 34: Painel Unificado de Gestão de Ramais | Aceito | 2026-04-18 |
| [049](049-onda-35-bulk-ops-health-score.md) | ADR-049 — Onda 35: Bulk Operations + Health Score por Ramal | Aceito |  |
| [050](050-onda-36-auditoria-telemetria-ramais.md) | ADR-050 — Onda 36: Auditoria + Telemetria Operacional do Painel de Ramais | Aceito | 2026-04-18 |
| [051](051-onda-37-property-based-fuzz-testing.md) | ADR-051 — Estratégia de Testes Massivos via Property-Based + Fuzz | Aceito | 2026-04-18 |
| [052](052-onda-d-fechamento-10-10.md) | ADR-052 — Onda D: Fechamento das pendências rumo ao 10/10 | Aceito | 2026-07-24 |
