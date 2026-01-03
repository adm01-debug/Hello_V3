# 📦 INVENTÁRIO COMPLETO DO REPOSITÓRIO - HELLO Contact Center

> **Documento gerado em:** 03/01/2026  
> **Projeto:** Hello Contact Center  
> **Plataforma de Desenvolvimento:** Lovable (LLM Claude/Anthropic + Lovable AI)  
> **⚠️ NOTA:** Este repositório é construído em parceria entre Claude (Anthropic) e Lovable, com arquivos upados por ambas as plataformas.

---

## 📁 ESTRUTURA RAIZ DO PROJETO

```
hello/
├── .github/                    # Configurações GitHub (CI/CD, workflows)
├── .husky/                     # Git hooks
├── .storybook/                 # Configuração Storybook
├── .vscode/                    # Configurações VS Code
├── a11y-tests/                 # Testes de acessibilidade
├── api-tests/                  # Testes de API/Contrato
├── chaos-tests/                # Testes de resiliência
├── docker/                     # Configurações Docker
├── docs/                       # Documentação completa
├── e2e/                        # Testes end-to-end (Playwright)
├── examples/                   # Exemplos de código
├── helm/                       # Charts Helm para Kubernetes
├── k8s/                        # Manifests Kubernetes
├── load-tests/                 # Testes de carga
├── monitoring/                 # Configurações de monitoramento
├── performance-tests/          # Testes de performance
├── public/                     # Arquivos estáticos
├── scripts/                    # Scripts de automação
├── security-tests/             # Testes de segurança
├── src/                        # Código fonte principal
├── supabase/                   # Backend Lovable Cloud
├── terraform/                  # Infraestrutura como código
├── visual-tests/               # Testes visuais
└── [arquivos de configuração]
```

---

## 🔧 ARQUIVOS DE CONFIGURAÇÃO NA RAIZ

| Arquivo | Descrição |
|---------|-----------|
| `.dependency-cruiser.js` | Análise de dependências |
| `.dockerignore` | Arquivos ignorados pelo Docker |
| `.editorconfig` | Configuração do editor |
| `.env` | Variáveis de ambiente (auto-gerado) |
| `.env.example` | Exemplo de variáveis de ambiente |
| `.eslintrc.json` | Configuração ESLint |
| `.gitignore` | Arquivos ignorados pelo Git |
| `.nycrc.json` | Configuração NYC (cobertura) |
| `.prettierignore` | Arquivos ignorados pelo Prettier |
| `.prettierrc` | Configuração Prettier |
| `.releaserc.json` | Configuração Semantic Release |
| `.size-limit.json` | Limite de tamanho do bundle |
| `.spellcheck.yml` | Verificação ortográfica |
| `ARCHITECTURE.md` | Documentação de arquitetura |
| `CHANGELOG.md` | Histórico de mudanças |
| `CODE_OF_CONDUCT.md` | Código de conduta |
| `CONTRIBUTING.md` | Guia de contribuição |
| `Dockerfile` | Build de container |
| `LICENSE` | Licença do projeto |
| `Makefile` | Comandos Make |
| `README.md` | Documentação principal |
| `bun.lock` | Lockfile do Bun |
| `bun.lockb` | Lockfile binário do Bun |
| `codecov.yml` | Configuração Codecov |
| `commitlint.config.json` | Validação de commits |
| `components.json` | Configuração shadcn/ui |
| `docker-compose.yml` | Orquestração Docker |
| `eslint.config.js` | Configuração ESLint (novo formato) |
| `i18n.json` | Configuração de internacionalização |
| `index.html` | HTML principal |
| `lint-staged.config.js` | Lint em staged files |
| `next.config.js` | Configuração Next.js (legado?) |
| `package.json` | Dependências e scripts |
| `playwright.config.ts` | Configuração Playwright |
| `postcss.config.js` | Configuração PostCSS |
| `renovate.json` | Atualização automática de deps |
| `sonar-project.properties` | Configuração SonarQube |
| `stryker.conf.json` | Mutation testing |
| `tailwind.config.ts` | Configuração Tailwind CSS |
| `tsconfig.app.json` | TypeScript config (app) |
| `tsconfig.json` | TypeScript config (raiz) |
| `tsconfig.node.json` | TypeScript config (node) |
| `vite.config.treeshaking.ts` | Vite config (tree shaking) |
| `vite.config.ts` | Configuração principal Vite |
| `vitest.config.ts` | Configuração Vitest |

---

## 📂 .github/ - CI/CD e Automação

### Workflows (.github/workflows/)
| Arquivo | Descrição |
|---------|-----------|
| `accessibility-test.yml` | Testes de acessibilidade |
| `ci.yml` | Pipeline CI principal |
| `code-quality.yml` | Análise de qualidade |
| `dependabot-auto-merge.yml` | Auto-merge Dependabot |
| `dependency-review.yml` | Review de dependências |
| `deploy-preview.yml` | Deploy de preview |
| `deploy.yml` | Deploy de produção |
| `lint.yml` | Linting |
| `performance-test.yml` | Testes de performance |
| `release.yml` | Release automático |
| `security-scan.yml` | Scan de segurança |
| `security.yml` | Políticas de segurança |
| `test-coverage.yml` | Cobertura de testes |
| `test.yml` | Testes automatizados |
| `trivy-scan.yml` | Scan de vulnerabilidades |
| `type-check.yml` | Verificação de tipos |

### Outros arquivos .github/
| Arquivo | Descrição |
|---------|-----------|
| `SECURITY.md` | Política de segurança |
| `dependabot.yml` | Configuração Dependabot |
| `labeler.yml` | Auto-labeling de PRs |

---

## 📂 src/ - Código Fonte Principal

### Arquivos na raiz de src/
| Arquivo | Descrição |
|---------|-----------|
| `App.tsx` | Componente principal da aplicação |
| `App.css` | Estilos globais da aplicação |
| `main.tsx` | Ponto de entrada React |
| `index.css` | Estilos Tailwind + design tokens |
| `vite-env.d.ts` | Tipos Vite |

---

## 📂 src/pages/ - 45 Páginas

### Autenticação e Segurança
| Arquivo | Descrição |
|---------|-----------|
| `Login.tsx` | Página de login com bloqueio de conta |
| `Register.tsx` | Página de registro |
| `ForgotPassword.tsx` | Recuperação de senha |
| `ResetPassword.tsx` | Redefinição de senha |
| `VerifyEmail.tsx` | Verificação de email |
| `TwoFactorAuth.tsx` | Autenticação de dois fatores |
| `Passkeys.tsx` | Gerenciamento de passkeys |
| `SessionManagement.tsx` | Gerenciamento de sessões |
| `Unauthorized.tsx` | Página de acesso não autorizado |

### Dashboard e Métricas
| Arquivo | Descrição |
|---------|-----------|
| `Index.tsx` | Dashboard principal |
| `ExecutiveDashboard.tsx` | Dashboard executivo |
| `QueueMetricsDashboard.tsx` | Métricas de fila |
| `CallAnalytics.tsx` | Análise de chamadas |
| `Reports.tsx` | Relatórios |

### Chamadas e Atendimento
| Arquivo | Descrição |
|---------|-----------|
| `Calls.tsx` | Painel de chamadas |
| `CallHistory.tsx` | Histórico de chamadas |
| `Recordings.tsx` | Gravações |
| `Voice.tsx` | Comandos de voz |
| `Callbacks.tsx` | Callbacks agendados |
| `Dialer.tsx` | Discador preditivo |

### Hold (Espera)
| Arquivo | Descrição |
|---------|-----------|
| `HoldMetrics.tsx` | Métricas de espera |
| `HoldAlerts.tsx` | Alertas de espera |
| `HoldAlertSettings.tsx` | Configurações de alerta |

### Contatos e CRM
| Arquivo | Descrição |
|---------|-----------|
| `Contacts.tsx` | Lista de contatos |
| `ContactInsights.tsx` | Insights de contatos |
| `History.tsx` | Histórico de interações |

### IA e Coaching
| Arquivo | Descrição |
|---------|-----------|
| `AIAssistant.tsx` | Assistente IA |
| `Coaching.tsx` | Coaching de agentes |

### Gamificação
| Arquivo | Descrição |
|---------|-----------|
| `AgentRanking.tsx` | Ranking de agentes |

### Alertas
| Arquivo | Descrição |
|---------|-----------|
| `Alerts.tsx` | Painel de alertas |
| `AlertHistory.tsx` | Histórico de alertas |
| `QueueMetricsAlertSettings.tsx` | Config. alertas de fila |

### Segurança (Admin)
| Arquivo | Descrição |
|---------|-----------|
| `SecurityDashboard.tsx` | Dashboard de segurança |
| `SecurityMonitoring.tsx` | Monitoramento de segurança |
| `SecurityReport.tsx` | Relatório de segurança |
| `AuditLogs.tsx` | Logs de auditoria |
| `IPWhitelist.tsx` | Whitelist de IPs |
| `BlockedAccessLogs.tsx` | Logs de acesso bloqueado |
| `GeoBlocking.tsx` | Bloqueio geográfico |
| `RateLimitDashboard.tsx` | Dashboard rate limit |
| `Roles.tsx` | Gerenciamento de roles |
| `Permissions.tsx` | Gerenciamento de permissões |
| `PasswordResetApproval.tsx` | Aprovação de reset de senha |

### Configurações
| Arquivo | Descrição |
|---------|-----------|
| `Settings.tsx` | Configurações gerais |
| `NotFound.tsx` | Página 404 |

---

## 📂 src/components/ - Componentes React

### Estrutura de Pastas
```
src/components/
├── Button/                # Componente de botão customizado
├── agent/                 # Componentes de agente
├── ai/                    # Componentes de IA
│   ├── AICallAnalysis.tsx
│   ├── CallSimulation.tsx
│   └── LiveCallAnalysis.tsx
├── alerts/                # Componentes de alertas
│   ├── AlertsDropdown.tsx
│   └── AlertsTrendChart.tsx
├── atendimentos/          # Componentes de atendimento
├── auth/                  # Componentes de autenticação
│   ├── PasskeyLogin.tsx
│   ├── PasskeyManager.tsx
│   ├── PasswordStrength.tsx
│   ├── PermissionGate.tsx
│   ├── ProtectedRoute.tsx
│   └── ReauthDialog.tsx
├── callbacks/             # Componentes de callback
├── calls/                 # Componentes de chamadas
│   ├── ActiveCallBar.tsx
│   ├── ActiveCallsIndicator.tsx
│   ├── LiveTranscription.tsx
│   ├── TransferCallDialog.tsx
│   ├── UnifiedSoftphone.tsx
│   └── WebRTCCall.tsx
├── charts/                # Componentes de gráficos
├── coaching/              # Componentes de coaching
│   └── CoachingPanel.tsx
├── contacts/              # Componentes de contatos
│   ├── ContactAlertsDropdown.tsx
│   ├── ContactDetailSheet.tsx
│   ├── CreateContactDialog.tsx
│   └── CustomerJourneyTimeline.tsx
├── dashboard/             # Componentes de dashboard
│   ├── ActiveCallsRealtime.tsx
│   ├── AgentsList.tsx
│   ├── CallVolumeChart.tsx
│   ├── DashboardGoalsSettings.tsx
│   ├── GoalViolationsHistory.tsx
│   ├── HoldTrendChart.tsx
│   ├── QueueStatus.tsx
│   ├── RecentCalls.tsx
│   └── StatsCard.tsx
├── dialer/                # Componentes do discador
│   ├── AddContactsDialog.tsx
│   ├── CreateCampaignDialog.tsx
│   └── PredictiveDialerPanel.tsx
├── error-boundary/        # Error boundaries
├── gamification/          # Componentes de gamificação
│   ├── AchievementCelebration.tsx
│   ├── AchievementNotificationProvider.tsx
│   ├── AgentGoalsProgress.tsx
│   ├── BadgeCard.tsx
│   ├── BadgesShowcase.tsx
│   ├── GamificationDashboard.tsx
│   └── WeeklyRanking.tsx
├── layout/                # Componentes de layout
│   ├── AppLayout.tsx
│   └── AppSidebar.tsx
├── lazy/                  # Componentes lazy-loaded
├── loading/               # Componentes de loading
├── notifications/         # Componentes de notificação
├── onboarding/            # Componentes de onboarding
├── security/              # Componentes de segurança
│   └── NotificationPermissionBanner.tsx
├── supervisor/            # Componentes do supervisor
│   ├── AlertSoundSettings.tsx
│   ├── QueueTrendChart.tsx
│   ├── SoundProfileManager.tsx
│   └── SupervisorPanel.tsx
├── ui/                    # Componentes shadcn/ui (50+ componentes)
└── virtual/               # Listas virtualizadas
```

### Componentes Soltos
| Arquivo | Descrição |
|---------|-----------|
| `BulkActionsBar.tsx` | Barra de ações em massa |
| `DataImporter.tsx` | Importador de dados |
| `DuplicateButton.tsx` | Botão de duplicar |
| `ExportDropdown.tsx` | Dropdown de exportação |
| `InfiniteScrollList.tsx` | Lista com scroll infinito |
| `NavLink.tsx` | Link de navegação |
| `SavedFiltersDropdown.tsx` | Filtros salvos |
| `SearchInput.tsx` | Input de busca |
| `VersionHistory.tsx` | Histórico de versões |
| `VoiceCommandButton.tsx` | Botão de comando de voz |
| `VoiceCommandPanel.tsx` | Painel de comando de voz |

### Componentes UI (shadcn/ui) - 50 Componentes
```
accordion, alert, alert-dialog, animations, aspect-ratio, avatar, 
badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, 
collapsible, command, context-menu, dialog, drawer, dropdown-menu, 
form, hover-card, input, input-otp, label, menubar, navigation-menu, 
pagination, popover, progress, radio-group, resizable, scroll-area, 
select, separator, sheet, sidebar, skeleton, slider, sonner, switch, 
table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip, 
VirtualList
```

---

## 📂 src/hooks/ - 46 Custom Hooks

| Arquivo | Descrição |
|---------|-----------|
| `use-mobile.tsx` | Detecção de mobile |
| `use-toast.ts` | Sistema de toasts |
| `useAchievementNotifications.ts` | Notificações de conquistas |
| `useAgentStatus.ts` | Status do agente |
| `useAuditLog.ts` | Log de auditoria |
| `useAuth.ts` | Autenticação |
| `useBitrix.ts` | Integração Bitrix |
| `useBulkActions.ts` | Ações em massa |
| `useCRUD.ts` | Operações CRUD genéricas |
| `useCallRecording.ts` | Gravação de chamadas |
| `useCallSession.ts` | Sessão de chamada |
| `useCoaching.ts` | Coaching de agentes |
| `useConferenceRecording.ts` | Gravação de conferência |
| `useContactAlerts.ts` | Alertas de contato |
| `useContactCenterData.ts` | Dados do contact center |
| `useContacts.ts` | Gestão de contatos |
| `useCriticalAlertNotifications.ts` | Alertas críticos |
| `useDeviceDetection.ts` | Detecção de dispositivo |
| `useDuplicate.ts` | Duplicação de registros |
| `useExportData.ts` | Exportação de dados |
| `useGamification.ts` | Gamificação |
| `useGeoValidation.ts` | Validação geográfica |
| `useHoldReminder.ts` | Lembrete de espera |
| `useHoldSoundAlert.ts` | Alerta sonoro de espera |
| `useIPValidation.ts` | Validação de IP |
| `useImportData.ts` | Importação de dados |
| `useInfiniteScroll.ts` | Scroll infinito |
| `useLoginLockout.ts` | Bloqueio de login |
| `useMFA.ts` | Autenticação multi-fator |
| `useMultiChannelCall.ts` | Chamada multicanal |
| `useNotifications.ts` | Sistema de notificações |
| `usePermissions.ts` | Permissões |
| `usePredictiveDialer.ts` | Discador preditivo |
| `usePushNotifications.ts` | Push notifications |
| `useQuery.ts` | Query genérica |
| `useRealtimeHoldAlerts.ts` | Alertas de espera realtime |
| `useReauth.ts` | Reautenticação |
| `useSavedFilters.ts` | Filtros salvos |
| `useScheduledCallbacks.ts` | Callbacks agendados |
| `useSearch.ts` | Busca |
| `useSecurityNotifications.ts` | Notificações de segurança |
| `useSessionManager.ts` | Gerenciamento de sessões |
| `useVersions.ts` | Versionamento |
| `useVoiceCommand.ts` | Comandos de voz |
| `useWavoipCall.ts` | Chamadas Wavoip |
| `useWebAuthn.ts` | WebAuthn/Passkeys |

---

## 📂 src/lib/ - Bibliotecas e Utilitários

### Estrutura Completa
```
src/lib/
├── a11y/                      # Acessibilidade
├── analytics/                 # Analytics
│   ├── ab-testing.ts
│   ├── analytics-service.ts
│   ├── custom-events.ts
│   ├── ga4.ts
│   └── revenue.ts
├── api/                       # Cliente API
│   ├── __tests__/
│   ├── gateway.ts
│   └── versioning.ts
├── audit/                     # Auditoria
│   └── audit-logger.ts
├── cache/                     # Cache
│   ├── cache-invalidator.ts
│   ├── cache-strategy.ts
│   ├── etag-handler.ts
│   ├── memory-cache.ts
│   ├── react-query-config.ts
│   ├── redis-client.ts
│   └── swr-strategy.ts
├── cdn/                       # CDN
├── crud/                      # CRUD genérico
├── database/                  # Utilitários de banco
├── email/                     # Email
├── export/                    # Exportação
├── feature-flags/             # Feature flags
├── graphql/                   # GraphQL
├── i18n/                      # Internacionalização
│   └── config.ts
├── import/                    # Importação
├── logging/                   # Logging
│   ├── log-aggregator.ts
│   ├── logger.ts
│   └── structured-logger.ts
├── metrics/                   # Métricas
├── mfa/                       # Multi-Factor Auth
│   ├── mfa-service.ts
│   └── totp-generator.ts
├── monitoring/                # Monitoramento
│   ├── apm.ts
│   ├── cost-monitoring.ts
│   ├── error-budget.ts
│   ├── error-tracker.ts
│   ├── feature-flags.ts
│   ├── journey-tracker.ts
│   ├── performance-monitor.ts
│   ├── rate-limit.ts
│   ├── rum.ts
│   ├── sentry.ts
│   ├── session-recording.ts
│   ├── sla-dashboard.ts
│   ├── synthetic.ts
│   └── user-analytics.ts
├── notifications/             # Notificações
│   └── notification-service.ts
├── offline/                   # Offline support
├── optimization/              # Otimizações
├── password/                  # Senha
│   ├── password-history.ts
│   ├── password-policy.ts
│   ├── password-strength.ts
│   └── password-validator.ts
├── performance/               # Performance
├── pwa/                       # Progressive Web App
├── queue/                     # Filas
├── responsive/                # Responsividade
├── search/                    # Busca
├── secrets/                   # Secrets
├── security/                  # Segurança (17 arquivos)
│   ├── api-key-rotation.ts
│   ├── audit-logger.ts
│   ├── content-security-policy.ts
│   ├── cors-config.ts
│   ├── csrf-token.ts
│   ├── encryption.ts
│   ├── helmet-config.ts
│   ├── hsts-headers.ts
│   ├── https-enforcer.ts
│   ├── input-sanitizer.ts
│   ├── jwt-handler.ts
│   ├── penetration-test-reporter.ts
│   ├── rate-limiter.ts
│   ├── secrets-scanner.ts
│   ├── security-headers-validator.ts
│   ├── sql-sanitizer.ts
│   └── xss-prevention.ts
├── seo/                       # SEO
├── session/                   # Sessão
│   └── session-manager.ts
├── state/                     # Estado
├── theme/                     # Temas
├── tracing/                   # Distributed tracing
├── upload/                    # Upload
├── validation/                # Validação
│   └── schemas.ts
├── webauthn/                  # WebAuthn
│   └── webauthn-utils.ts
├── webhooks/                  # Webhooks
├── websocket/                 # WebSocket
│   ├── websocket-client.ts
│   └── websocket-server.ts
├── workflow/                  # Workflows
├── workflows/                 # Workflows (duplicado?)
├── helloSchemas.ts            # Schemas do Hello
├── supabase.ts                # Cliente Supabase
└── utils.ts                   # Utilitários gerais
```

---

## 📂 src/api/ - Rotas de API

```
src/api/
├── health/                    # Health checks
│   └── checks/
│       └── database.ts
├── v1/                        # API v1
│   └── routes/
│       └── index.ts
├── v2/                        # API v2
│   └── routes/
│       └── index.ts
└── version-router.ts          # Router de versões
```

---

## 📂 src/middleware/ - Middlewares

| Arquivo | Descrição |
|---------|-----------|
| `api-authentication.ts` | Autenticação de API |
| `request-validation.ts` | Validação de requisições |
| `sanitize-middleware.ts` | Sanitização de dados |
| `security-headers.ts` | Headers de segurança |

---

## 📂 src/__tests__/ - Testes

```
src/__tests__/
├── contract/                  # Testes de contrato
├── database/                  # Testes de banco
│   └── migrations.test.ts
├── factories/                 # Factories para testes
│   ├── call-factory.ts
│   └── user-factory.ts
├── integration/               # Testes de integração
│   └── auth-flow.test.ts
├── mocks/                     # Mocks (MSW)
│   ├── handlers.ts
│   └── server.ts
├── property/                  # Property-based tests
├── security/                  # Testes de segurança
│   ├── cors-config.test.ts
│   └── rate-limiter.test.ts
├── smoke/                     # Smoke tests
├── snapshot/                  # Snapshot tests
├── unit/                      # Testes unitários
│   └── lib/
│       └── sanitizer.test.ts
├── setup.ts                   # Setup de testes
└── test-utils.tsx             # Utilitários de teste
```

---

## 📂 src/domain/ - Domain (DDD)

```
src/domain/
├── entities/
│   ├── __tests__/
│   └── User.ts
├── repositories/
│   └── IUserRepository.ts
└── value-objects/
    ├── __tests__/
    ├── Email.ts
    └── UserId.ts
```

---

## 📂 src/application/ - Camada de Aplicação

```
src/application/
├── dto/
│   └── LoginDTO.ts
└── use-cases/
```

---

## 📂 src/infrastructure/ - Infraestrutura

```
src/infrastructure/
└── database/
```

---

## 📂 supabase/ - Backend Lovable Cloud

### Estrutura
```
supabase/
├── functions/                 # Edge Functions (28 funções)
├── migrations/                # Migrações SQL (43 arquivos)
├── query-analysis/            # Análise de queries
│   └── slow-queries.sql
├── config.toml                # Configuração Supabase
└── seed.sql                   # Dados iniciais
```

### Edge Functions (28 funções)
| Função | Descrição |
|--------|-----------|
| `_shared/` | Código compartilhado |
| `analyze-call/` | Análise de chamada com IA |
| `analyze-contact-profile/` | Análise de perfil de contato |
| `analyze-sentiment/` | Análise de sentimento |
| `approve-password-reset/` | Aprovação de reset de senha |
| `bitrix-api/` | Integração Bitrix CRM |
| `check-alerts/` | Verificação de alertas |
| `check-contact-alerts/` | Alertas de contato |
| `check-goals/` | Verificação de metas |
| `check-hold-alerts/` | Alertas de espera |
| `check-queue-metrics/` | Métricas de fila |
| `database-backup/` | Backup de banco |
| `database-cleanup/` | Limpeza de banco |
| `elevenlabs-conversation-token/` | Token ElevenLabs |
| `generate-coaching/` | Geração de coaching IA |
| `generate-summary/` | Resumo de chamada IA |
| `notify-blocked-ip/` | Notificação IP bloqueado |
| `notify-new-device/` | Notificação novo dispositivo |
| `realtime-analysis/` | Análise em tempo real |
| `request-password-reset/` | Solicitar reset de senha |
| `stored-procedures/` | Procedures armazenadas |
| `transcribe-recording/` | Transcrição de gravação |
| `validate-geo/` | Validação geográfica |
| `validate-ip/` | Validação de IP |
| `voice-command/` | Comando de voz |
| `voice-transcribe/` | Transcrição de voz |
| `wavoip-call/` | Chamadas Wavoip |
| `webauthn-authenticate/` | Autenticação WebAuthn |

### Migrações (43 arquivos)
Migrações datadas de 31/12/2024 a 31/12/2025, incluindo:
- Tabelas de usuários, agentes, chamadas
- Segurança (RLS, rate limiting, geo-blocking)
- Gamificação (badges, rankings)
- Discador preditivo
- Alertas e métricas
- WebAuthn/Passkeys
- Bloqueio de login

---

## 📂 terraform/ - Infraestrutura como Código

```
terraform/
├── modules/
│   ├── database/
│   ├── ddos-protection/
│   └── vault/
├── test/
│   └── infrastructure_test.go
├── backend.tf
├── main.tf
├── outputs.tf
├── variables.tf
└── workspaces.tf
```

---

## 📂 k8s/ - Kubernetes

```
k8s/
├── argocd/                    # ArgoCD configs
├── deployments/               # Deployments
├── istio/                     # Service mesh
├── monitoring/                # Monitoramento
├── operators/                 # Operators
├── overlays/                  # Kustomize overlays
├── api-gateway.yaml
├── cert-manager.yaml
├── configmap.yaml
├── deployment.yaml
├── hpa.yaml                   # Horizontal Pod Autoscaler
├── ingress.yaml
├── network-policies.yaml
├── networkpolicy.yaml
├── pdb.yaml                   # Pod Disruption Budget
├── secret.yaml
├── service.yaml
└── waf-rules.yaml             # Web Application Firewall
```

---

## 📂 helm/ - Helm Charts

```
helm/
├── hello/
│   └── [chart files]
└── values.yaml
```

---

## 📂 monitoring/ - Monitoramento

```
monitoring/
├── alertmanager/              # Configuração Alertmanager
├── grafana/                   # Dashboards Grafana
└── prometheus/                # Configuração Prometheus
```

---

## 📂 docker/ - Docker

| Arquivo | Descrição |
|---------|-----------|
| `nginx-http2-push.conf` | Configuração Nginx com HTTP/2 Push |
| `nginx.conf` | Configuração Nginx principal |
| `production.dockerfile` | Dockerfile de produção |

---

## 📂 scripts/ - Scripts de Automação

```
scripts/
├── build/                     # Scripts de build
├── database/                  # Scripts de banco
├── performance/               # Scripts de performance
├── security/                  # Scripts de segurança
├── 0-master-upload.sh
├── 1-audit-repository.sh
├── 2-prepare-files.sh
├── 3-commit-and-push.sh
├── 4-verify-upload.sh
├── README.md
├── analyze-bundle.js
├── detailed-audit.sh
└── pre-check.sh
```

---

## 📂 docs/ - Documentação

### Diretórios
```
docs/
├── accessibility/             # Acessibilidade
├── adr/                       # Architecture Decision Records
│   ├── 0001-use-react.md
│   ├── 001-clean-architecture.md
│   └── template.md
├── api/                       # Documentação de API
│   ├── API_EXAMPLES.md
│   ├── API_REFERENCE.md
│   ├── AUTHENTICATION.md
│   ├── RATE_LIMITING.md
│   ├── WEBHOOKS.md
│   └── openapi.yaml
├── architecture/              # Arquitetura
│   ├── API_DESIGN.md
│   ├── C4_DIAGRAMS.md
│   ├── DATABASE_ERD.md
│   ├── DATABASE_SCHEMA.md
│   ├── DATABASE_SHARDING.md
│   ├── DECISION_LOG.md
│   ├── SEQUENCE_DIAGRAMS.md
│   └── SYSTEM_ARCHITECTURE.md
├── deployment/                # Deploy
├── design-system/             # Design System
├── development/               # Desenvolvimento
├── guides/                    # Guias
├── legal/                     # Legal
├── onboarding/                # Onboarding
├── operations/                # Operações
├── performance/               # Performance
├── releases/                  # Releases
├── runbooks/                  # Runbooks
├── security/                  # Segurança
│   ├── INCIDENT_RESPONSE_PLAN.md
│   ├── SECURITY_CHECKLIST.md
│   └── VULNERABILITY_REPORTING.md
├── testing/                   # Testes
├── troubleshooting/           # Troubleshooting
└── user/                      # Documentação do usuário
```

### Documentos na raiz de docs/
| Arquivo | Descrição |
|---------|-----------|
| `API.md` | Documentação de API |
| `ARCHITECTURE.md` | Arquitetura do sistema |
| `DEPLOYMENT.md` | Guia de deploy |
| `FUNCIONALIDADES_COMPLETAS.md` | Levantamento de funcionalidades |
| `PADROES_CODIGO.md` | Padrões de código |
| `SECURITY.md` | Documentação de segurança |
| `USER_KEYBOARD_SHORTCUTS.md` | Atalhos de teclado |
| `doc231.md` - `doc250.md` | Documentos adicionais (20 arquivos) |

---

## 📂 Testes Especializados

### e2e/ - Testes End-to-End
```
e2e/
├── auth/                      # Testes de autenticação
├── calls/                     # Testes de chamadas
├── cross-browser/             # Testes cross-browser
├── dashboard/                 # Testes de dashboard
├── mobile/                    # Testes mobile
├── reports/                   # Testes de relatórios
├── settings/                  # Testes de configurações
└── dashboard.spec.ts
```

### security-tests/ - Testes de Segurança
| Arquivo | Descrição |
|---------|-----------|
| `authentication-tests.ts` | Testes de autenticação |
| `authorization-tests.ts` | Testes de autorização |
| `owasp-top-10.test.ts` | OWASP Top 10 |
| `sql-injection-tests.ts` | SQL Injection |
| `xss-tests.ts` | Cross-Site Scripting |

### a11y-tests/ - Testes de Acessibilidade
| Arquivo | Descrição |
|---------|-----------|
| `axe-core.test.ts` | Testes com Axe Core |
| `keyboard-navigation.test.ts` | Navegação por teclado |
| `wcag-compliance.test.ts` | Conformidade WCAG |

### load-tests/ - Testes de Carga
| Arquivo | Descrição |
|---------|-----------|
| `concurrent-users.test.ts` | Usuários concorrentes |
| `load-balancing.test.ts` | Load balancing |

### performance-tests/ - Testes de Performance
| Arquivo | Descrição |
|---------|-----------|
| `lighthouse.config.js` | Configuração Lighthouse |
| `lighthouse.test.ts` | Testes Lighthouse |
| `load-tests.ts` | Testes de carga |
| `memory-leak.test.ts` | Vazamento de memória |
| `regression.test.ts` | Regressão de performance |
| `stress-tests.ts` | Testes de stress |
| `web-vitals-monitor.ts` | Monitoramento Web Vitals |

### chaos-tests/ - Testes de Caos
| Arquivo | Descrição |
|---------|-----------|
| `resilience.test.ts` | Testes de resiliência |

### visual-tests/ - Testes Visuais
| Arquivo | Descrição |
|---------|-----------|
| `components.visual.test.ts` | Regressão visual |

---

## 📊 ESTATÍSTICAS DO REPOSITÓRIO

### Contagem de Arquivos por Tipo
| Categoria | Quantidade |
|-----------|------------|
| Páginas (src/pages/) | 45 |
| Custom Hooks (src/hooks/) | 46 |
| Componentes UI (src/components/ui/) | 50 |
| Edge Functions (supabase/functions/) | 28 |
| Migrações SQL | 43 |
| GitHub Workflows | 16 |
| Documentação (docs/) | 50+ |
| Testes | 20+ arquivos |

### Tabelas do Banco de Dados
O projeto possui 50+ tabelas incluindo:
- Usuários, perfis, sessões
- Chamadas, gravações, transcrições
- Contatos, interações
- Agentes, badges, rankings
- Alertas, métricas, metas
- Segurança (audit, rate limit, geo-blocking)
- Discador preditivo

### Integrações
| Serviço | Uso |
|---------|-----|
| Lovable AI | Gateway de IA (Gemini/GPT) |
| ElevenLabs | Text-to-Speech |
| Wavoip | VoIP/Telefonia |
| Bitrix | CRM |

---

## ⚠️ ERRO CRÍTICO ATUAL

**O arquivo `package.json` possui erro de sintaxe na linha 16:**
```json
"test:unit": "vitest run --testPathPattern='\.test\.ts$'"
```

O caractere `\` não é válido em JSON. **Você precisa corrigir manualmente** alterando para:
```json
"test:unit": "vitest run"
```

---

## 📝 NOTAS IMPORTANTES

1. **Origem dos arquivos:** Este repositório é construído em parceria entre:
   - **Lovable AI** - Plataforma de desenvolvimento
   - **Claude (Anthropic)** - LLM que auxilia no desenvolvimento
   - Alguns arquivos foram upados diretamente via GitHub pela LLM Claude

2. **Arquivos auto-gerados (NÃO EDITAR):**
   - `src/integrations/supabase/types.ts`
   - `src/integrations/supabase/client.ts`
   - `supabase/config.toml`
   - `.env`

3. **Padrão de arquitetura:**
   - Clean Architecture (Domain, Application, Infrastructure)
   - Componentes React funcionais
   - Custom hooks para lógica reutilizável
   - Edge Functions para backend

---

*Documento gerado automaticamente pelo inventário do repositório.*
