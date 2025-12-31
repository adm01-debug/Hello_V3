# 📋 LEVANTAMENTO COMPLETO DE FUNCIONALIDADES - HELLO Contact Center

## 🏗️ ARQUITETURA E STACK TECNOLÓGICA

### Frontend
| Tecnologia | Uso |
|------------|-----|
| **React 18** | Framework principal |
| **TypeScript** | Tipagem estática |
| **Vite** | Build tool e dev server |
| **Tailwind CSS** | Estilização |
| **shadcn/ui** | Componentes de UI |
| **React Query** | Gerenciamento de estado server-side |
| **React Router v6** | Roteamento |
| **Framer Motion** | Animações |

### Backend (Lovable Cloud / Supabase)
| Tecnologia | Uso |
|------------|-----|
| **PostgreSQL** | Banco de dados |
| **Supabase Auth** | Autenticação |
| **Supabase Storage** | Armazenamento de arquivos |
| **Edge Functions (Deno)** | Funções serverless |
| **Row Level Security (RLS)** | Segurança de dados |
| **Supabase Realtime** | Atualizações em tempo real |

---

## 🔐 MÓDULO DE SEGURANÇA

### 1. Controle de Acesso por IP
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Validação de IP | `supabase/functions/validate-ip/` |
| Whitelist de IPs | `src/pages/IPWhitelist.tsx` |
| Logs de acesso bloqueado | `src/pages/BlockedAccessLogs.tsx` |
| Notificação de IP bloqueado | `supabase/functions/notify-blocked-ip/` |
| Hook de validação | `src/hooks/useIPValidation.ts` |
| Tabela: `ip_whitelist` | Armazena IPs permitidos globalmente |
| Tabela: `user_allowed_ips` | IPs permitidos por usuário |
| Tabela: `user_ip_restrictions` | Configuração de restrição por usuário |
| Tabela: `blocked_access_logs` | Registro de acessos bloqueados |
| Função DB: `check_ip_allowed()` | Verifica se IP está autorizado |
| Função DB: `check_ip_in_cidr()` | Verifica IP em range CIDR |

### 2. Auditoria e Logs
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Logs de auditoria | `src/pages/AuditLogs.tsx` |
| Hook de auditoria | `src/hooks/useAuditLog.ts` |
| Logger de auditoria | `src/lib/audit/` |
| Tabela: `audit_logs` | Registro de todas as ações |
| Função DB: `log_audit_event()` | Registra eventos de auditoria |
| Trigger: `check_suspicious_activity()` | Detecta atividades suspeitas |

### 3. Alertas de Segurança
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Monitoramento de segurança | `src/pages/SecurityMonitoring.tsx` |
| Relatório de segurança | `src/pages/SecurityReport.tsx` |
| Tabela: `security_alerts` | Armazena alertas de segurança |

### 4. Bibliotecas de Segurança
| Funcionalidade | Arquivo |
|----------------|---------|
| Rotação de API Keys | `src/lib/security/api-key-rotation.ts` |
| Content Security Policy | `src/lib/security/content-security-policy.ts` |
| Configuração CORS | `src/lib/security/cors-config.ts` |
| Token CSRF | `src/lib/security/csrf-token.ts` |
| Criptografia | `src/lib/security/encryption.ts` |
| Headers Helmet | `src/lib/security/helmet-config.ts` |
| Headers HSTS | `src/lib/security/hsts-headers.ts` |
| Forçar HTTPS | `src/lib/security/https-enforcer.ts` |
| Sanitização de Input | `src/lib/security/input-sanitizer.ts` |
| Manipulador JWT | `src/lib/security/jwt-handler.ts` |
| Relatório de Pentest | `src/lib/security/penetration-test-reporter.ts` |
| Rate Limiter | `src/lib/security/rate-limiter.ts` |
| Scanner de Secrets | `src/lib/security/secrets-scanner.ts` |
| Validador de Headers | `src/lib/security/security-headers-validator.ts` |
| Sanitização SQL | `src/lib/security/sql-sanitizer.ts` |
| Prevenção XSS | `src/lib/security/xss-prevention.ts` |

### 5. Autenticação e Autorização
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Login | `src/pages/Login.tsx` |
| Registro | `src/pages/Register.tsx` |
| Hook de Auth | `src/hooks/useAuth.ts` |
| Componentes Auth | `src/components/auth/` |
| MFA | `src/lib/mfa/` |
| Gerenciamento de Senha | `src/lib/password/` |
| Gerenciamento de Sessão | `src/lib/session/` |
| Tabela: `user_profiles` | Perfis de usuário |
| Função DB: `get_user_role()` | Retorna role do usuário |
| Função DB: `is_admin_or_supervisor()` | Verifica permissão |
| Função DB: `get_user_agent_id()` | Retorna ID do agente |
| Função DB: `get_user_agent_name()` | Retorna nome do agente |
| Função DB: `can_access_agent_data()` | Verifica acesso a dados |

---

## 📞 MÓDULO DE CHAMADAS

### 1. Gestão de Chamadas
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Painel de chamadas | `src/pages/Calls.tsx` |
| Histórico de chamadas | `src/pages/CallHistory.tsx` |
| Análise de chamadas | `src/pages/CallAnalytics.tsx` |
| Softphone unificado | `src/components/calls/UnifiedSoftphone.tsx` |
| Barra de chamada ativa | `src/components/calls/ActiveCallBar.tsx` |
| Indicador de chamadas | `src/components/calls/ActiveCallsIndicator.tsx` |
| Transcrição ao vivo | `src/components/calls/LiveTranscription.tsx` |
| Transferência de chamada | `src/components/calls/TransferCallDialog.tsx` |
| Chamada WebRTC | `src/components/calls/WebRTCCall.tsx` |
| Hook de sessão | `src/hooks/useCallSession.ts` |
| Hook de gravação | `src/hooks/useCallRecording.ts` |
| Hook multicanal | `src/hooks/useMultiChannelCall.ts` |
| Tabela: `call_sessions` | Sessões de chamada |
| Tabela: `call_transcriptions` | Transcrições |
| Tabela: `call_analyses` | Análises de chamada |
| Tabela: `call_summaries` | Resumos de chamada |
| Tabela: `call_alerts` | Alertas de chamada |

### 2. Gravações
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Página de gravações | `src/pages/Recordings.tsx` |
| Hook de gravação de conferência | `src/hooks/useConferenceRecording.ts` |
| Transcrição de gravação | `supabase/functions/transcribe-recording/` |
| Tabela: `call_recordings` | Armazenamento de gravações |
| Storage Bucket: `call-recordings` | Arquivos de áudio |

### 3. Integração VoIP
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Integração Wavoip | `supabase/functions/wavoip-call/` |
| Hook Wavoip | `src/hooks/useWavoipCall.ts` |
| Comando de voz | `supabase/functions/voice-command/` |
| Transcrição de voz | `supabase/functions/voice-transcribe/` |
| Hook comando de voz | `src/hooks/useVoiceCommand.ts` |
| Botão de comando | `src/components/VoiceCommandButton.tsx` |
| Painel de comando | `src/components/VoiceCommandPanel.tsx` |
| Página de voz | `src/pages/Voice.tsx` |

### 4. Hold (Espera)
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Métricas de hold | `src/pages/HoldMetrics.tsx` |
| Alertas de hold | `src/pages/HoldAlerts.tsx` |
| Configurações de alerta | `src/pages/HoldAlertSettings.tsx` |
| Hook de lembrete | `src/hooks/useHoldReminder.ts` |
| Hook de som de alerta | `src/hooks/useHoldSoundAlert.ts` |
| Hook realtime alerts | `src/hooks/useRealtimeHoldAlerts.ts` |
| Verificar alertas | `supabase/functions/check-hold-alerts/` |
| Tabela: `hold_events` | Eventos de espera |
| Tabela: `hold_alert_settings` | Configurações de alerta |

### 5. Callbacks Agendados
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Página de callbacks | `src/pages/Callbacks.tsx` |
| Componentes callback | `src/components/callbacks/` |
| Hook de callbacks | `src/hooks/useScheduledCallbacks.ts` |
| Tabela: `scheduled_callbacks` | Callbacks agendados |

---

## 🤖 MÓDULO DE INTELIGÊNCIA ARTIFICIAL

### 1. Análise de Chamadas
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Análise de chamada | `supabase/functions/analyze-call/` |
| Análise em tempo real | `supabase/functions/realtime-analysis/` |
| Análise de sentimento | `supabase/functions/analyze-sentiment/` |
| Geração de resumo | `supabase/functions/generate-summary/` |
| Componente análise AI | `src/components/ai/AICallAnalysis.tsx` |
| Análise ao vivo | `src/components/ai/LiveCallAnalysis.tsx` |
| Simulação de chamada | `src/components/ai/CallSimulation.tsx` |
| Verificar alertas | `supabase/functions/check-alerts/` |
| API: **Lovable AI (Gemini/GPT)** | Gateway de IA integrado |

### 2. Coaching e Recomendações
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Página de coaching | `src/pages/Coaching.tsx` |
| Componentes coaching | `src/components/coaching/` |
| Hook de coaching | `src/hooks/useCoaching.ts` |
| Geração de coaching | `supabase/functions/generate-coaching/` |
| Tabela: `coaching_recommendations` | Recomendações |

### 3. Assistente IA
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Assistente IA | `src/pages/AIAssistant.tsx` |

### 4. Token ElevenLabs
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Token de conversação | `supabase/functions/elevenlabs-conversation-token/` |
| API: **ElevenLabs** | Text-to-Speech |

---

## 👥 MÓDULO DE CONTATOS

### 1. Gestão de Contatos
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Lista de contatos | `src/pages/Contacts.tsx` |
| Insights de contato | `src/pages/ContactInsights.tsx` |
| Detalhe de contato | `src/components/contacts/ContactDetailSheet.tsx` |
| Criar contato | `src/components/contacts/CreateContactDialog.tsx` |
| Timeline do cliente | `src/components/contacts/CustomerJourneyTimeline.tsx` |
| Hook de contatos | `src/hooks/useContacts.ts` |
| Tabela: `contacts` | Dados de contatos |
| Tabela: `contact_interactions` | Interações com contatos |

### 2. Alertas de Contato
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Dropdown de alertas | `src/components/contacts/ContactAlertsDropdown.tsx` |
| Hook de alertas | `src/hooks/useContactAlerts.ts` |
| Verificar alertas | `supabase/functions/check-contact-alerts/` |
| Análise de perfil | `supabase/functions/analyze-contact-profile/` |
| Tabela: `contact_alerts` | Alertas de contato |

### 3. Integração Bitrix
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| API Bitrix | `supabase/functions/bitrix-api/` |
| Hook Bitrix | `src/hooks/useBitrix.ts` |

---

## 📊 MÓDULO DE DISCADOR PREDITIVO

### 1. Campanhas
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Página do discador | `src/pages/Dialer.tsx` |
| Criar campanha | `src/components/dialer/CreateCampaignDialog.tsx` |
| Adicionar contatos | `src/components/dialer/AddContactsDialog.tsx` |
| Painel preditivo | `src/components/dialer/PredictiveDialerPanel.tsx` |
| Hook do discador | `src/hooks/usePredictiveDialer.ts` |
| Tabela: `dialer_campaigns` | Campanhas |
| Tabela: `dialer_queue` | Fila de discagem |

---

## 🏆 MÓDULO DE GAMIFICAÇÃO

### 1. Ranking e Badges
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Ranking de agentes | `src/pages/AgentRanking.tsx` |
| Dashboard gamificação | `src/components/gamification/GamificationDashboard.tsx` |
| Ranking semanal | `src/components/gamification/WeeklyRanking.tsx` |
| Showcase de badges | `src/components/gamification/BadgesShowcase.tsx` |
| Card de badge | `src/components/gamification/BadgeCard.tsx` |
| Progresso de metas | `src/components/gamification/AgentGoalsProgress.tsx` |
| Celebração | `src/components/gamification/AchievementCelebration.tsx` |
| Provider de notificação | `src/components/gamification/AchievementNotificationProvider.tsx` |
| Hook gamificação | `src/hooks/useGamification.ts` |
| Hook notificações | `src/hooks/useAchievementNotifications.ts` |
| Tabela: `badges` | Definição de badges |
| Tabela: `agent_badges` | Badges conquistados |
| Tabela: `agent_weekly_stats` | Estatísticas semanais |
| Tabela: `agent_goals` | Metas de agentes |

---

## 📈 MÓDULO DE MÉTRICAS E DASHBOARD

### 1. Dashboards
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Dashboard principal | `src/pages/Index.tsx` |
| Dashboard executivo | `src/pages/ExecutiveDashboard.tsx` |
| Métricas de fila | `src/pages/QueueMetricsDashboard.tsx` |
| Componentes dashboard | `src/components/dashboard/` |
| Componentes de gráficos | `src/components/charts/` |
| Verificar métricas | `supabase/functions/check-queue-metrics/` |

### 2. Metas e KPIs
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Configuração de alertas | `src/pages/QueueMetricsAlertSettings.tsx` |
| Verificar metas | `supabase/functions/check-goals/` |
| Tabela: `dashboard_goals` | Metas do dashboard |
| Tabela: `goal_violations` | Violações de meta |
| Tabela: `queue_metrics_settings` | Config. métricas fila |

### 3. Relatórios
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Página de relatórios | `src/pages/Reports.tsx` |
| Histórico | `src/pages/History.tsx` |
| Histórico de alertas | `src/pages/AlertHistory.tsx` |

---

## 👔 MÓDULO SUPERVISOR

### 1. Painel do Supervisor
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Painel supervisor | `src/components/supervisor/SupervisorPanel.tsx` |
| Gráfico de tendências | `src/components/supervisor/QueueTrendChart.tsx` |
| Config. som de alertas | `src/components/supervisor/AlertSoundSettings.tsx` |
| Gerenciador de perfis | `src/components/supervisor/SoundProfileManager.tsx` |
| Hook alertas críticos | `src/hooks/useCriticalAlertNotifications.ts` |

### 2. Whisper e Barge-in
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Tabela: `whisper_messages` | Mensagens whisper |
| Tabela: `barge_in_sessions` | Sessões de intervenção |

---

## 👤 MÓDULO DE AGENTES

### 1. Gestão de Agentes
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Componentes agent | `src/components/agent/` |
| Hook de status | `src/hooks/useAgentStatus.ts` |
| Tabela: `agents` | Dados de agentes |

---

## ⚙️ MÓDULO DE CONFIGURAÇÕES

### 1. Páginas de Configuração
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Página de settings | `src/pages/Settings.tsx` |
| Alertas | `src/pages/Alerts.tsx` |
| Página não autorizado | `src/pages/Unauthorized.tsx` |
| Página não encontrada | `src/pages/NotFound.tsx` |

---

## 🔧 INFRAESTRUTURA E UTILITÁRIOS

### 1. Bibliotecas de Suporte
| Categoria | Diretório | Funcionalidade |
|-----------|-----------|----------------|
| Acessibilidade | `src/lib/a11y/` | Suporte a acessibilidade |
| Analytics | `src/lib/analytics/` | Rastreamento de eventos |
| API | `src/lib/api/` | Cliente de API |
| Cache | `src/lib/cache/` | Gerenciamento de cache |
| CDN | `src/lib/cdn/` | Integração com CDN |
| Database | `src/lib/database/` | Utilitários de banco |
| Email | `src/lib/email/` | Envio de emails |
| Export | `src/lib/export/` | Exportação de dados |
| Feature Flags | `src/lib/feature-flags/` | Flags de feature |
| GraphQL | `src/lib/graphql/` | Cliente GraphQL |
| i18n | `src/lib/i18n/` | Internacionalização |
| Import | `src/lib/import/` | Importação de dados |
| Logging | `src/lib/logging/` | Sistema de logs |
| Metrics | `src/lib/metrics/` | Coleta de métricas |
| Monitoring | `src/lib/monitoring/` | Monitoramento |
| Notifications | `src/lib/notifications/` | Sistema de notificações |
| Offline | `src/lib/offline/` | Suporte offline |
| Optimization | `src/lib/optimization/` | Otimizações |
| Performance | `src/lib/performance/` | Monitoramento de perf |
| PWA | `src/lib/pwa/` | Progressive Web App |
| Queue | `src/lib/queue/` | Sistema de filas |
| Responsive | `src/lib/responsive/` | Design responsivo |
| Search | `src/lib/search/` | Busca |
| SEO | `src/lib/seo/` | Otimização para buscas |
| State | `src/lib/state/` | Gerenciamento de estado |
| Theme | `src/lib/theme/` | Sistema de temas |
| Tracing | `src/lib/tracing/` | Rastreamento distribuído |
| Upload | `src/lib/upload/` | Upload de arquivos |
| Validation | `src/lib/validation/` | Validação de dados |
| Webhooks | `src/lib/webhooks/` | Sistema de webhooks |
| Websocket | `src/lib/websocket/` | Conexões websocket |
| Workflow | `src/lib/workflow/` | Automação de workflows |

### 2. Componentes de UI
| Categoria | Diretório | Funcionalidade |
|-----------|-----------|----------------|
| UI Base | `src/components/ui/` | Componentes shadcn/ui |
| Loading | `src/components/loading/` | Estados de carregamento |
| Error Boundary | `src/components/error-boundary/` | Tratamento de erros |
| Layout | `src/components/layout/` | Estrutura da página |
| Lazy | `src/components/lazy/` | Componentes lazy-loaded |
| Virtual | `src/components/virtual/` | Listas virtualizadas |
| Charts | `src/components/charts/` | Gráficos |
| Notifications | `src/components/notifications/` | Notificações |
| Onboarding | `src/components/onboarding/` | Onboarding de usuários |

### 3. Manutenção de Banco
| Funcionalidade | Arquivo/Ferramenta |
|----------------|-------------------|
| Backup de banco | `supabase/functions/database-backup/` |
| Limpeza de banco | `supabase/functions/database-cleanup/` |
| Procedures armazenadas | `supabase/functions/stored-procedures/` |

### 4. Workers
| Funcionalidade | Diretório |
|----------------|-----------|
| Workers em background | `src/workers/` |

---

## 🌐 INTEGRAÇÕES EXTERNAS

| Serviço | Uso | Configuração |
|---------|-----|--------------|
| **Lovable AI** | Gateway de IA (Gemini/GPT) | Automático (LOVABLE_API_KEY) |
| **ElevenLabs** | Text-to-Speech | ELEVENLABS_API_KEY |
| **Wavoip** | VoIP/Telefonia | WAVOIP_TOKEN |
| **Bitrix** | CRM | API via Edge Function |

---

## 🗃️ TABELAS DO BANCO DE DADOS (RESUMO)

### Usuários e Agentes
- `user_profiles` - Perfis de usuário
- `agents` - Dados de agentes
- `agent_badges` - Badges conquistados
- `agent_weekly_stats` - Estatísticas semanais
- `agent_goals` - Metas de agentes

### Chamadas
- `call_sessions` - Sessões de chamada
- `call_transcriptions` - Transcrições
- `call_analyses` - Análises de chamada
- `call_summaries` - Resumos
- `call_alerts` - Alertas de chamada
- `call_recordings` - Gravações

### Contatos
- `contacts` - Dados de contatos
- `contact_interactions` - Interações
- `contact_alerts` - Alertas de contato

### Discador
- `dialer_campaigns` - Campanhas
- `dialer_queue` - Fila de discagem

### Métricas e Metas
- `dashboard_goals` - Metas
- `goal_violations` - Violações
- `queue_metrics_settings` - Configurações

### Gamificação
- `badges` - Definição de badges

### Segurança
- `audit_logs` - Logs de auditoria
- `security_alerts` - Alertas de segurança
- `ip_whitelist` - Whitelist global
- `user_allowed_ips` - IPs por usuário
- `user_ip_restrictions` - Restrições
- `blocked_access_logs` - Acessos bloqueados

### Supervisor
- `whisper_messages` - Mensagens whisper
- `barge_in_sessions` - Sessões barge-in

### Hold
- `hold_events` - Eventos de espera
- `hold_alert_settings` - Configurações

### Outros
- `scheduled_callbacks` - Callbacks agendados
- `coaching_recommendations` - Recomendações de coaching

---

## 📁 ESTRUTURA DE DIRETÓRIOS

```
├── docs/                    # Documentação
├── k8s/                     # Configurações Kubernetes
├── scripts/                 # Scripts de automação
├── src/
│   ├── __tests__/          # Testes unitários
│   ├── api/                # Definições de API
│   ├── application/        # Casos de uso
│   ├── components/         # Componentes React
│   ├── config/             # Configurações
│   ├── contexts/           # Context API
│   ├── data/               # Dados estáticos
│   ├── database/           # Utilitários de banco
│   ├── domain/             # Entidades de domínio
│   ├── hooks/              # Custom hooks
│   ├── infrastructure/     # Infraestrutura
│   ├── integrations/       # Integrações (Supabase)
│   ├── lib/                # Bibliotecas utilitárias
│   ├── middleware/         # Middlewares
│   ├── pages/              # Páginas da aplicação
│   ├── router/             # Configuração de rotas
│   ├── utils/              # Funções utilitárias
│   └── workers/            # Web Workers
├── supabase/
│   ├── functions/          # Edge Functions
│   └── config.toml         # Configuração Supabase
└── public/                  # Assets públicos
```

---

## 🔑 SECRETS CONFIGURADOS

| Secret | Uso |
|--------|-----|
| `SUPABASE_URL` | URL do Supabase |
| `SUPABASE_ANON_KEY` | Chave anônima |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço |
| `SUPABASE_DB_URL` | URL do banco |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública |
| `LOVABLE_API_KEY` | API do Lovable AI |
| `ELEVENLABS_API_KEY` | API do ElevenLabs |
| `WAVOIP_TOKEN` | Token do Wavoip |

---

## 📋 EDGE FUNCTIONS (RESUMO)

| Função | Propósito | JWT Requerido |
|--------|-----------|---------------|
| `analyze-call` | Análise de chamada com IA | Sim |
| `analyze-contact-profile` | Análise de perfil de contato | Sim |
| `analyze-sentiment` | Análise de sentimento | Sim |
| `bitrix-api` | Integração com Bitrix CRM | Sim |
| `check-alerts` | Verificar alertas de chamada | Sim |
| `check-contact-alerts` | Verificar alertas de contato | Sim |
| `check-goals` | Verificar metas | Não |
| `check-hold-alerts` | Verificar alertas de hold | Sim |
| `check-queue-metrics` | Verificar métricas de fila | Não |
| `database-backup` | Backup do banco | - |
| `database-cleanup` | Limpeza do banco | - |
| `elevenlabs-conversation-token` | Token ElevenLabs | Sim |
| `generate-coaching` | Gerar recomendações | Sim |
| `generate-summary` | Gerar resumo de chamada | Sim |
| `notify-blocked-ip` | Notificar IP bloqueado | Não |
| `realtime-analysis` | Análise em tempo real | Sim |
| `transcribe-recording` | Transcrever gravação | Sim |
| `validate-ip` | Validar IP do usuário | Sim |
| `voice-command` | Processar comando de voz | Sim |
| `voice-transcribe` | Transcrever áudio | Sim |
| `wavoip-call` | Integração Wavoip | Sim |

---

*Documento gerado para referência de padrões do projeto Hello Contact Center*
*Última atualização: Dezembro 2025*
