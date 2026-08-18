<!-- Gerado pela auditoria de estado. Fonte: lote P2. -->

> **Procedência:** lote `P2` da auditoria de estado.
> **Recontagem de cobertura (Fase D):** 67/67 arquivos citados (100%).
> **Limitação global:** sem acesso ao banco/runtime — nada nesta página é verificado contra produção.

# Lote P2 — src/pages (parte 2)

## Cobertura

67 arquivos do manifesto (~9.568 linhas) — 100% inspecionados.
Método: leitura de `src/routes/protectedRoutes.tsx` (204 linhas), `src/routes/publicRoutes.tsx` (30), `src/App.tsx` (106) e `src/components/layout/AppSidebar.tsx` / `CommandPalette.tsx` / `MobileBottomNav.tsx` antes das páginas; depois leitura integral dos arquivos ≤ 250 linhas e leitura dirigida + varredura estática (AST-like por regex) nos maiores.

Varreduras globais executadas sobre os 67 arquivos:
- `Math.random` / `TODO` / `FIXME` / `console.log` / `onClick={() => {}}` / "em breve" / mock → **zero ocorrências** fora de `src/pages/roles/__tests__/useRoles.test.ts` (mocks legítimos de teste).
- Tabelas/RPC/Edge Functions do Supabase citadas diretamente: 25 ocorrências, todas em tabelas reais.
- 40 hooks referenciados pelas páginas foram resolvidos no disco — **todos existem** e todos consultam tabelas/RPC/Edge Functions reais (nenhum retorna dado sintético).
- Varredura de `<Button>` sem `onClick`/`asChild`/`type=submit` → 3 botões realmente mortos (evidências abaixo).
- Varredura de hooks React dentro de funções aninhadas → 1 caso real confirmado (`TopicDetection.tsx:100`), demais falso-positivos verificados manualmente.

Registro de rotas: `App.tsx:52-62` (públicas) e `App.tsx:73-89` (protegidas, com `ProtectedRoute requiredRoles` em `App.tsx:80`).

## Tabela de funcionalidades

| Página | Classificação | Rota | No menu? | Dado real? | Role | O que falta |
|---|---|---|---|---|---|---|
| `Renewals.tsx` | 🟨 | `/renewals` (protectedRoutes.tsx:145) | **Não** (ausente em AppSidebar/CommandPalette/MobileBottomNav) | Sim — `useRenewals` → `renewals` (useRenewals.ts:32) | nenhuma | Página só lê. `useRenewals` expõe `upsert` (useRenewals.ts:85) que a página nunca usa (Renewals.tsx:30) → sem criar/editar renovação. Sem link de menu. |
| `Reports.tsx` | 🟨 | `/reports` (protectedRoutes.tsx:120) | Sim (AppSidebar.tsx:51) | Sim — `useDashboardStats`, `useCallVolumeData`, `rpc('get_agent_performance')` (Reports.tsx:45) | nenhuma | Select de período é inerte: `<Select defaultValue="today">` sem `onValueChange` (Reports.tsx:80). Botão "Exportar" sem `onClick` (Reports.tsx:93). |
| `ResetPassword.tsx` | ✅ | `/reset-password` (publicRoutes.tsx:21) | n/a (pública) | Sim — `supabase.auth.getSession` (:46), `onAuthStateChange` (:52), `updateUser` (:81) | pública | — |
| `RingGroups.tsx` | ✅ | `/ring-groups` (protectedRoutes.tsx:162) | Sim (AppSidebar.tsx:104) | Sim — `useRingGroups` + `useCallQueues` | supervisor, admin | CRUD completo (criar :116, editar/excluir :216, refetch :110). |
| `Roles.tsx` | ✅ | `/roles` (protectedRoutes.tsx:180) | Sim (AppSidebar.tsx:100) | Sim — `user_roles` + `user_profiles` (useRoles.ts:15,23) | admin | Compõe 5 subcomponentes; add/remove/toggle + trilha de auditoria (Roles.tsx:45,69,73). |
| `RoutingRules.tsx` | ✅ | `/routing-rules` (protectedRoutes.tsx:156) | Sim (AppSidebar.tsx:72) | Sim — `routing_rules` (useRoutingRules.ts:26,43,65) | supervisor, admin | CRUD completo (:55, :95, :98, :175). |
| `SLAPolicies.tsx` | ✅ | `/sla-policies` (protectedRoutes.tsx:157) | Sim (AppSidebar.tsx:73) | Sim — `sla_policies`, `conversations`, edge `enforce-sla` (useSLA.ts:27,45,99) | supervisor, admin | Criar/editar (:47,:101,:184). |
| `Scheduling.tsx` | 🟨 | `/scheduling` (protectedRoutes.tsx:147) | Sim (AppSidebar.tsx:60) | Sim — `useShifts` + `useTimeOff` | supervisor, admin | `createTimeOff` é desestruturado (Scheduling.tsx:33) e **nunca usado** → não há UI para solicitar folga, só aprovar/rejeitar (:143-144). |
| `SecurityDashboard.tsx` (raiz) | ✅ | `/security` (protectedRoutes.tsx:132) | Sim (AppSidebar.tsx:77) | Sim — `useSecurityDashboard` → `user_ip_restrictions`, `security_alerts`, `blocked_access_logs` | nenhuma | Hub de navegação + KPIs reais. |
| `SecurityMonitoring.tsx` | ✅ | `/security-monitoring` (protectedRoutes.tsx:177) | Sim (AppSidebar.tsx:98) | Sim — `useSecurityMonitoringData` (`audit_logs`, `security_alerts`) + `login_attempts` (:164) | admin | Live toggle (:61), refresh (:64), resolver alerta (:133). |
| `SecurityReport.tsx` | 🟨 | `/security-report` (protectedRoutes.tsx:176) | Sim (AppSidebar.tsx:99) | **Parcial** — RLS vem de `rpc('check_all_tables_rls_status')` (:61), mas `securityFeatures`/`securityDecisions` são **estáticos** (`src/lib/security-report-data.ts`, 80 linhas hardcoded) | admin | Relatório exportado contém seção fabricada — ver Achados graves. |
| `SessionManagement.tsx` | ✅ | `/sessions` (protectedRoutes.tsx:131) | Sim (AppSidebar.tsx:78) | Sim — `useSessionManager` + `useReauth` | nenhuma | Revogar sessão/todas (:191,:221,:263). |
| `Settings.tsx` | 🟨 | `/settings` (protectedRoutes.tsx:127) | Sim (AppSidebar.tsx:107) | **Não** nas abas Notificações/Áudio (estado local + listas fixas) | nenhuma | `handleSave` só emite toast, não persiste (Settings.tsx:39-41). Selects de mic/alto-falante hardcoded, sem `enumerateDevices` (:220,:235). "Testar microfone"/"Testar áudio" sem `onClick` (:278,:282). Cards "Central de Ajuda"/"Enviar Feedback" com `cursor-pointer` e sem handler (:67,:77). Switch "Programa Beta" sem handler (:96). Abas Perfil/Integrações/VoIP/Sistema delegam a componentes reais. |
| `ShiftSwapSuggestions.tsx` | ✅ | `/shift-swap-suggestions` (protectedRoutes.tsx:195) | Sim (AppSidebar.tsx:105) | Sim — `shift_swap_suggestions` + edge `suggest-shift-swaps` (useShiftSwapSuggestions.ts:26,41,58) | supervisor, admin | Gerar/aprovar/rejeitar (:35,:75,:78). |
| `Skills.tsx` | 🟨 | `/skills` (protectedRoutes.tsx:148) | Sim (AppSidebar.tsx:61) | Sim — `skills` + `agent_skills` (useSkills.ts:28,37) | supervisor, admin | `upsertAgentSkill` desestruturado (Skills.tsx:17) e **nunca usado** → a "Matriz por Agente" é somente leitura, não dá para atribuir proficiência. |
| `Status.tsx` | 🟨 | `/status` (publicRoutes.tsx:27) | Rodapé marketing (MarketingLayout.tsx:48) | Sim — `voip_trunk_health_checks` + `webhook_flush_metrics` (:77,:82) | **pública (sem auth)** | Exposição de dados internos em rota pública + `computeUptime` retorna 100 quando não há amostras (:52) → exibe "Todos os sistemas operacionais" com zero dados. Ver Achados graves. |
| `SuccessPlans.tsx` | 🟨 | `/success-plans` (protectedRoutes.tsx:146) | **Não** | Sim — `success_plans` + `success_plan_milestones` (useSuccessPlans.ts:42,51) | nenhuma | `createPlan` existe no hook (useSuccessPlans.ts:100) mas a página não o usa → só marca/desmarca marcos (SuccessPlans.tsx:49). Sem link de menu. |
| `TollFreeNumbers.tsx` | 🟨 | `/toll-free-numbers` (protectedRoutes.tsx:186) | Sim (AppSidebar.tsx:54) | Sim — `toll_free_numbers` (:14) | admin | Somente leitura; nenhum provisionamento. A própria página declara `⚠️ Aguardando integração com operadora` (:28). |
| `TopicDetection.tsx` | 🟨 | `/topic-detection` (protectedRoutes.tsx:171) | Sim (AppSidebar.tsx:39) | Sim — `topic_trends`, `manager_alerts`, `topic_detections` (:52,:65,:78,:89) | supervisor, admin | **Hook mal posicionado**: `usePageTitle` chamado dentro do subcomponente `TrendIcon` (TopicDetection.tsx:99-100). Ver Achados graves. |
| `Trackers.tsx` | 🟨 | `/trackers` (protectedRoutes.tsx:143) | **Não** | Sim — `useTrackers` → `trackers` | supervisor, admin | Sem excluir tracker (`Trash2` importado em :2 e nunca usado no JSX). `useTrackerMatches` existe (useTrackers.ts:58) mas os matches nunca são exibidos → o valor do tracker não aparece. Sem link de menu. |
| `TranslationCenter.tsx` | ✅ | `/translation-center` (protectedRoutes.tsx:153) | Sim (AppSidebar.tsx:66) | Sim — `call_translations` + `cultural_hints` (:47,:48) | nenhuma | Visualizador read-only por design (a tradução ocorre na chamada). |
| `TwoFactorAuth.tsx` | ✅ | `/two-factor-auth` (protectedRoutes.tsx:129) | Sim (AppSidebar.tsx:79) | Sim — `useMFA` → `user_mfa_settings` + Supabase MFA (useMFA.ts:55,176) | nenhuma | Orquestra 4 subcards; TOTP, SMS, backup codes e devices todos ligados (:194-217). |
| `Unauthorized.tsx` | ✅ | `/unauthorized` (publicRoutes.tsx:23) | n/a | n/a (estática por natureza) | pública | — |
| `VerifyEmail.tsx` | ✅ | `/verify-email` (publicRoutes.tsx:22) | n/a | Sim — `supabase.auth.getSession` (:25) e `auth.resend` (:70) | pública | — |
| `VideoConference.tsx` | 🟨 | `/video-conference` (protectedRoutes.tsx:134) | Sim (AppSidebar.tsx:40) | Sim para CRUD (`video_conferences` :40,:73,:81); **falso** para a reunião em si | nenhuma | `handleStartMeeting` monta URL `https://meet.jit.si/<titulo>-<id8>` no cliente, com comentário `// Simulação de ativação de reunião` (:35-37). Badge `⚠️ Aguardando integração com provedor de vídeo` (:107). Ver Achados graves. |
| `VirtualFax.tsx` | 🟨 | `/virtual-fax` (protectedRoutes.tsx:136) | Sim (AppSidebar.tsx:52) | Sim — `virtual_fax` (:27,:35) e OCR real via edge `ocr-virtual-fax` (useVirtualFaxOcr.ts:9) | nenhuma | "Enviar" apenas faz INSERT com `status:'pending'` (:35-38) e mostra "Fax enviado para fila!" — nenhum provedor consome a fila; não há upload de documento. Badge `⚠️ Aguardando integração com provedor de fax` (:62). |
| `VoiceSecurity.tsx` | ✅ | `/voice-security` (protectedRoutes.tsx:152) | Sim (AppSidebar.tsx:65) | Sim — `voice_prints`, `fraud_signals` + edges `enroll-voice`/`verify-voice`/`redact-sensitive-audio` (useVoiceBiometrics.ts:40,59,91,110,149,166) | nenhuma | Enroll/verify/remove/redact todos ligados (:66,:70,:130,:196). |
| `Voicemail.tsx` | ✅ | `/voicemail` (protectedRoutes.tsx:133) | Sim (AppSidebar.tsx:38) | Sim — `voicemail_messages` (:42,:53,:63) | nenhuma | Filtros, busca debounced, marcar lido, excluir (:98-183). |
| `admin/DataExport.tsx` | ✅ | `/admin/data-export` (protectedRoutes.tsx:196) | Sim (AppSidebar.tsx:106) | Sim — `data_lake_exports` + edge `export-data-lake` + signed URL no Storage (useDataLakeExports.ts:29,47,60) | admin | Criar export, atualizar, baixar (:69,:72,:105). |
| `admin/DatabaseHealth.tsx` | ✅ | `/admin/database-health` (protectedRoutes.tsx:197) | **Não** | Sim — `rpc('get_database_health_snapshot')`, `rpc('get_top_slow_queries')`, `rpc('check_idle_indexes')`, `index_drop_audit` (:26,:37,:47,:58) | admin | Sem link de menu (só URL direta). |
| `admin/ExtensionsAdmin.tsx` | ✅ | `/admin/extensions` (protectedRoutes.tsx:192) | Sim (AppSidebar.tsx:102) | Sim — `useExtensionsAdmin` | admin | Bulk offline, bulk trunk, export CSV, navegação cruzada (:104-169). |
| `admin/SecurityAlerts.tsx` | ✅ | `/admin/security-alerts` (protectedRoutes.tsx:198) | **Não** | Sim — 7 hooks reais (`useWebhookQueue`, `useWebhookHistory`, `useWebhookConfig`, `useAlertsExport`, `useSecurityAlertNotifications`, `useAlertPresets`, `useTestWebhook`) | admin | Página compõe 8 subcomponentes de `src/components/security-alerts/`. Sem link de menu. |
| `admin/SecurityDashboard.tsx` | 🟨 | `/admin/security-audit` (protectedRoutes.tsx:193, alias `SecurityAudit`) | **Não** | Sim — `audit_logs` (:29) | admin | Filtro "Buscar Usuário" tem `onChange` (:61) mas `filter.user` **nunca entra na query** (`fetchLogs` :27-41 só usa `filter.type`); `filter.date` declarado (:19) e nunca usado; badges "Últimas 24h"/"7 Dias" com `cursor-pointer` e sem `onClick` (:93-94). Sem `usePageTitle`. |
| `admin/SecurityAuditDashboard.tsx` | ⬛ | **nenhuma** | Não | Sim — `audit_logs`, `rls_audit_logs`, `webhook_flush_metrics` (:78,:79,:81) | (checa `hasRole(['admin'])` :63) | 313 linhas totalmente implementadas (busca funcional :121-127, filtro por tipo, gráfico Recharts, guard de role) e **nunca importadas em lugar algum** — versão superior da rota `/admin/security-audit` que ficou órfã. Ver Achados graves. |
| `admin/SloDashboard.tsx` | ✅ | `/admin/slo` (protectedRoutes.tsx:200) | **Não** | Sim — edge function `health-check` (:35), refetch 30s | admin | Metas SLO são constantes de negócio declaradas (:21-25), o que é correto. Usa `document.title` (:29) em vez de `usePageTitle`. Sem link de menu. |
| `admin/VoiceQuality.tsx` | 🟨 | `/admin/voice-quality` (protectedRoutes.tsx:167) | **Não** | Sim — `call_quality_metrics`, agregação client-side (:28-56) | supervisor, admin | Coluna `trunk_name` é sempre `null` hardcoded (:49) → coluna morta na tabela. Usa `document.title` (:20). Sem link de menu. |
| `admin/VoipTrunksAdmin.tsx` | ✅ | `/admin/voip-trunks` (protectedRoutes.tsx:191) | Sim (AppSidebar.tsx:101) | Sim — `useVoipTrunks`, `useTrunkRealtimeMetrics`, `useVoipMonitoringSettings` | admin | CRUD + health check + teste de trunk (:87,:91,:170,:173,:176,:179). |
| `admin/WebhookHealth.tsx` | ✅ | `/admin/webhook-health` (protectedRoutes.tsx:199) | **Não** | Sim — `useWebhookHealthData` + `lib/webhook-health-utils` | admin | Delega a 4 subcomponentes em `components/admin/webhook-health/`; atalhos de teclado (:60-70). Sem link de menu. |
| `marketing/Landing.tsx` | 🟨 | `/landing` (publicRoutes.tsx:24) | n/a | **Não** — 100% copy estático: `stats` hardcoded (:88-93, ex.: "99,95%", "40+"), `testimonials` fictícios (:95-113), `faqs` (:116+) | pública | CTA "Agendar demo gratuita" (:171) aponta para a âncora `#demo` (:360) que **não tem formulário** — apenas dois links para `/register` e `/pricing`. Nenhum `<form>`/`onSubmit` no arquivo. |
| `marketing/Pricing.tsx` | 🟨 | `/pricing` (publicRoutes.tsx:25) | n/a | **Não** — preços hardcoded (:11 "R$ 149", :27 "R$ 299", :45 "Sob consulta") | pública | Nenhuma integração de billing/checkout; CTAs vão a `/register` (:22) e `/landing#demo` (:39,:58). |
| `marketing/VsThreeCPlus.tsx` | 🟨 | `/vs/3cplus` (publicRoutes.tsx:26) | n/a | **Não** — matriz comparativa 100% hardcoded (:16+) | pública | Página pública faz afirmações sobre concorrente nomeado sem fonte/verificação. Ver Achados graves. |

### Subcomponentes (sem rota própria, por design)

| Arquivo | Classificação | Importado por | Dado real? | O que falta |
|---|---|---|---|---|
| `marketing/MarketingLayout.tsx` | 🟨 | `Marketplace.tsx:1`, `Status.tsx:2`, e as 3 páginas de marketing | n/a | Botão de menu mobile sem `onClick` e sem nav associada (:63) → navegação quebrada em telas `<md`. |
| `call-analytics/AnalyticsHeader.tsx` | ✅ | `CallAnalytics.tsx:4` | via props (`useCallAnalytics`) | — |
| `call-analytics/CallsByDayChart.tsx` | ✅ | `CallAnalytics.tsx:5` | via props | — |
| `call-analytics/KpiCards.tsx` | ✅ | `CallAnalytics.tsx:6` | via props | — |
| `call-analytics/SentimentBreakdown.tsx` | ✅ | `CallAnalytics.tsx:7` | via props | — |
| `call-analytics/SentimentPieChart.tsx` | ✅ | `CallAnalytics.tsx:8` | via props, com estado vazio tratado (:30-34) | — |
| `call-analytics/TopTopicsList.tsx` | ✅ | `CallAnalytics.tsx:9` | via props, estado vazio tratado (:33-35) | — |
| `call-analytics/chart-utils.ts` | ✅ | `CallsByDayChart.tsx:4`, `SentimentPieChart.tsx:4` | n/a (5 linhas de estilo) | — |
| `admin/database-health/types.ts` | ✅ | `DatabaseHealth.tsx:11` | n/a (tipos) | — |
| `admin/database-health/ActivityCards.tsx` | ✅ | `DatabaseHealth.tsx:12` | via props do RPC | — |
| `admin/database-health/BloatCard.tsx` | ✅ | `DatabaseHealth.tsx:13` | via props do RPC | — |
| `admin/database-health/TopTablesCard.tsx` | ✅ | `DatabaseHealth.tsx:14` | via props do RPC | — |
| `admin/database-health/IdleIndexesCard.tsx` | ✅ | `DatabaseHealth.tsx:15` | Sim — `rpc('log_index_drop_copy')` (:53) | Ação é "copiar DDL + auditar", não executa DROP (comportamento seguro e intencional). |
| `admin/database-health/DropAuditCard.tsx` | ✅ | `DatabaseHealth.tsx:16` | via props (`index_drop_audit`) | — |
| `admin/database-health/SlowQueriesCard.tsx` | ✅ | `DatabaseHealth.tsx:17` | via props (`get_top_slow_queries`); trata `pg_stat_statements` ausente (:42) | — |
| `roles/types.ts` | ✅ | `useRoles.ts:6` | n/a (tipos) | — |
| `roles/useRoles.ts` | ✅ | `Roles.tsx:7` | Sim — `user_roles` + `user_profiles` (:15,:23,:50,:60,:83,:97) | — |
| `roles/RoleStatsCards.tsx` | ✅ | `Roles.tsx:8` | via props | — |
| `roles/AddRoleDialog.tsx` | ✅ | `Roles.tsx:9` | via callback `onAdd` (:82) | — |
| `roles/RolesTable.tsx` | ✅ | `Roles.tsx:10` | via props; toggle (:56) e remove (:66) | — |
| `roles/RoleAuditTrail.tsx` | ✅ | `Roles.tsx:11` | Sim — `audit_logs` filtrado por `user_roles`/`role_permissions` (:120-124), com paginação server-side (:295-312) | — |
| `roles/__tests__/useRoles.test.ts` | ✅ | (suite Vitest) | mocks intencionais (:16-58) | Não executei os testes; não afirmo que passam. |
| `two-factor/TotpCard.tsx` | ✅ | `TwoFactorAuth.tsx:14` | via `useMFA` (props) — start/verify/copy (:54,:71,:90) | — |
| `two-factor/SmsCard.tsx` | ✅ | `TwoFactorAuth.tsx:15` | via `useMFA` (:59,:88) | — |
| `two-factor/BackupCodesCard.tsx` | ✅ | `TwoFactorAuth.tsx:16` | via `useMFA` (:42) | — |
| `two-factor/DevicesCard.tsx` | ✅ | `TwoFactorAuth.tsx:17` | via `useMFA` (:50) | — |

## Páginas sem rota (separando subcomponentes de órfãs reais)

**Subcomponentes legítimos (28 arquivos)** — importados por páginas roteadas, não são órfãos:
- `marketing/MarketingLayout.tsx` → `Marketplace.tsx:1`, `Status.tsx:2`
- `call-analytics/*` (7 arquivos) → `CallAnalytics.tsx:4-9`
- `admin/database-health/*` (7 arquivos) → `admin/DatabaseHealth.tsx:11-17`
- `roles/*` (6 arquivos + 1 teste) → `Roles.tsx:7-11`
- `two-factor/*` (4 arquivos) → `TwoFactorAuth.tsx:14-17`

**Órfã real (1 arquivo)**:
- `src/pages/admin/SecurityAuditDashboard.tsx` (313 linhas). Busca por `SecurityAuditDashboard` em todo `src/` retorna **apenas o próprio arquivo** — não está em `protectedRoutes.tsx`, não está em `publicRoutes.tsx`, não é importado por nenhuma página ou componente. Código funcional e completo, morto.

**Páginas roteadas mas sem entrada de menu em nenhum dos três navegadores** (`AppSidebar.tsx`, `CommandPalette.tsx`, `MobileBottomNav.tsx`) — acessíveis só por URL direta:
`/renewals`, `/success-plans`, `/trackers`, `/admin/database-health`, `/admin/security-alerts`, `/admin/security-audit`, `/admin/slo`, `/admin/voice-quality`, `/admin/webhook-health`.

## Achados graves

1. **Hook React dentro de subcomponente aninhado — `src/pages/TopicDetection.tsx:99-100`**
   ```
   const TrendIcon = ({ dir }: { dir: string }) => {
     usePageTitle('Detecção de Temas');
   ```
   `usePageTitle` está no corpo de `TrendIcon`, definido dentro de `TopicDetection`. Consequências: o título da página só é aplicado se/quando algum `TrendIcon` for renderizado (não há trend → título nunca muda); com N tendências renderizadas o efeito roda N vezes; e como `TrendIcon` é recriado a cada render do pai, a identidade do componente muda e o efeito é remontado a cada ciclo. Único caso confirmado no lote — os outros 9 candidatos da varredura foram verificados manualmente e são falso-positivos.

2. **Página órfã substituindo a versão inferior em produção — `src/pages/admin/SecurityAuditDashboard.tsx` vs `src/pages/admin/SecurityDashboard.tsx`**
   A rota `/admin/security-audit` (`protectedRoutes.tsx:85,193`) aponta para `admin/SecurityDashboard.tsx` (148 linhas), cujo filtro de usuário é decorativo (`SecurityDashboard.tsx:58-62` grava `filter.user`, mas `fetchLogs` em `:27-41` só usa `filter.type`) e cujos badges "Últimas 24h"/"7 Dias" (`:93-94`) têm `cursor-pointer` sem handler. A versão completa (`SecurityAuditDashboard.tsx`, com busca funcional em `:121-127`, filtro por tipo `:125-127`, guard `hasRole(['admin'])` `:63` e gráfico de flush de webhooks) nunca foi ligada a nenhuma rota. O usuário admin vê a versão pior.

3. **Métricas fabricadas dentro de relatório de auditoria exportável — `src/pages/SecurityReport.tsx:97-101`**
   ```
   4. RESULTADO DO TESTE DE CARGA (SIMULAÇÃO)
   - Resposta de Inserção: < 50ms (Meta 10/10)
   - Resposta de Busca: < 100ms (Meta 10/10)
   - Gargalos Identificados: Nenhum no momento (Escalabilidade Supabase OK)
   ```
   Esses números são literais no código, não medidos. O arquivo é baixado como `auditoria-voip-10-10-<data>.txt` (`:113`) e a seção 3 ("Políticas de isolamento de extensão", `:88-92`) também é texto fixo. Só a seção 2 (tabelas/RLS) vem de dado real (`rpc('check_all_tables_rls_status')`, `:61`). Um documento de compliance com números inventados é risco material. Complementarmente, `securityFeatures`/`securityDecisions` (`src/lib/security-report-data.ts`) são uma autoavaliação estática de 80 linhas, incluindo a afirmação "22 tabelas com RLS habilitado" que não é reconciliada com o RPC real.

4. **Rota pública expondo telemetria de infraestrutura — `src/pages/Status.tsx:77-86` + `publicRoutes.tsx:27`**
   `/status` está em `publicRoutes` (fora de `ProtectedRoute`, `App.tsx:52-62`) e consulta `voip_trunk_health_checks` e `webhook_flush_metrics` direto do cliente, com `limit(20000)` cada. Se a RLS dessas tabelas permitir `anon`, qualquer visitante obtém 90 dias de health checks de trunks SIP e métricas de webhooks; se não permitir, a página exibe permanentemente "Todos os sistemas operacionais" — porque `computeUptime` retorna `100` quando não há amostras (`Status.tsx:52`) e `overallOk` é `services.every(...)` (`:131`), que é `true` para lista vazia. Nos dois cenários o resultado é ruim. A página ainda afirma "Métricas alimentadas diretamente pelos health checks internos — sem edição manual" (`:205-206`).

5. **Videoconferência "iniciada" sem provedor — `src/pages/VideoConference.tsx:35-52`**
   ```
   // Simulação de ativação de reunião (em um sistema real, isso chamaria uma Edge Function de integração)
   const meetingUrl = `https://meet.jit.si/${conf.title.replace(/\s+/g, '-')}-${conf.id.slice(0, 8)}`;
   ```
   A URL é montada no cliente a partir do título e de 8 caracteres do UUID, gravada em `video_conferences.meeting_url` e aberta com `window.open`. São salas públicas do Jitsi, sem senha, com nome parcialmente adivinhável a partir do título da reunião — reunião corporativa em sala aberta. A própria página admite a lacuna (`:107`).

6. **Fax que não sai — `src/pages/VirtualFax.tsx:35-45`**
   `sendFax` só faz `insert({ to_number, subject, direction:'outbound', status:'pending' })` e dispara `toast.success('Fax enviado para fila!')`. Não há upload de documento nem consumidor da fila (nenhuma edge function de envio; o único edge usado é `ocr-virtual-fax`, de leitura). O usuário recebe confirmação de um envio que não ocorreu.

7. **Configurações que não persistem — `src/pages/Settings.tsx:39-41`**
   ```
   const handleSave = () => {
     toast.success('✓ Configurações salvas', { description: 'Suas preferências foram atualizadas' });
   };
   ```
   Nenhuma escrita. As preferências de notificação vivem só em `useState` (`:32-37`) e se perdem no reload; o mesmo botão é reusado na aba de Áudio (`:286`), cujos switches (`:257,:263,:272`) são `defaultChecked` sem estado. Somam-se 2 botões mortos (`:278,:282`), 2 cards clicáveis sem handler (`:67,:77`) e 1 switch sem handler (`:96`) na mesma página.

8. **Navegação mobile quebrada nas páginas públicas — `src/pages/marketing/MarketingLayout.tsx:63`**
   `<Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">` não tem `onClick` nem `Sheet`/`DropdownMenu` associado. Em viewport `<md` os links do header estão ocultos (`hidden md:flex`) e o único acesso restante é inerte — Landing, Pricing, Vs3CPlus, Status e Marketplace ficam sem navegação no celular.

9. **Página pública com comparativo não verificável sobre concorrente nomeado — `src/pages/marketing/VsThreeCPlus.tsx:16-60`**
   Matriz hardcoded de ~40 linhas afirmando ausência de funcionalidades num produto concorrente identificado pelo nome, sem data, fonte ou ressalva, servida em rota pública (`/vs/3cplus`). Exposição jurídica/reputacional; ao menos exige data de referência e disclaimer.

10. **Filtros decorativos (padrão recorrente)** — além do item 2: `Reports.tsx:80` (`<Select defaultValue="today">` sem `onValueChange`, seletor de período que não filtra nada) e `Reports.tsx:93` (botão "Exportar" sem `onClick`). São controles que sinalizam capacidade inexistente ao usuário.

11. **Superfície de hook implementada e não exposta** — três casos onde a camada de dados existe e a UI não a usa: `Skills.tsx:17` (`upsertAgentSkill` — matriz de proficiência é read-only), `Scheduling.tsx:33` (`createTimeOff` — não há como solicitar folga), `Renewals.tsx:30`/`SuccessPlans.tsx:12` (`upsert`/`createPlan` inexistentes na tela). Em `Trackers.tsx:2` o ícone `Trash2` é importado e nunca renderizado, indício de exclusão planejada e não feita, e `useTrackerMatches` (useTrackers.ts:58) nunca é consumido — os matches, que são o produto do tracker, não aparecem em lugar nenhum.

## Integrações de terceiros observadas

| Integração | Onde | Situação |
|---|---|---|
| **Supabase** (Postgres + Auth + Storage + Edge Functions + RPC) | Backbone de todo o lote — `@/integrations/supabase/client` em 25 pontos diretos e em 100% dos 40 hooks resolvidos | Real e operante. RPCs: `get_agent_performance`, `check_all_tables_rls_status`, `get_database_health_snapshot`, `get_top_slow_queries`, `check_idle_indexes`, `log_index_drop_copy`. Storage: bucket `data-lake-exports` com signed URL (useDataLakeExports.ts:60). Auth: `getSession`, `onAuthStateChange`, `updateUser`, `resend`, MFA. |
| **Supabase Edge Functions** | `health-check` (SloDashboard.tsx:35), `suggest-shift-swaps` (useShiftSwapSuggestions.ts:41), `export-data-lake` (useDataLakeExports.ts:47), `enforce-sla` (useSLA.ts:99), `ocr-virtual-fax` (useVirtualFaxOcr.ts:9), `enroll-voice` / `verify-voice` / `redact-sensitive-audio` (useVoiceBiometrics.ts:59,91,166) | Todas invocadas de verdade. Não verifiquei o código das funções (fora do escopo do lote). |
| **Jitsi Meet** (`meet.jit.si`) | `VideoConference.tsx:37` | Não é integração — é uma URL pública montada por concatenação de string no cliente. Sem SDK, sem API, sem sala privada. Ver achado 5. |
| **Bitrix24** | Citado como integração nativa em `marketing/Pricing.tsx:35` e `VsThreeCPlus.tsx`; descrito em `Status.tsx:117` como consumidor de webhooks; aba "Integrações" de `Settings.tsx:132` delega a `@/components/settings/BitrixIntegration` | A implementação vive fora deste lote; aqui aparece apenas como referência textual e delegação. |
| **WhatsApp** | Prometido em `marketing/Landing.tsx:38` e `Pricing.tsx:31`; mencionado em `Status.tsx:117` | Nenhum código de integração neste lote. |
| **Operadora de telefonia (0800)** | `TollFreeNumbers.tsx:28` | Declaradamente ausente: "Aguardando integração com operadora". Página só lê a tabela. |
| **Provedor de vídeo** | `VideoConference.tsx:107` | Declaradamente ausente. |
| **Provedor de fax** | `VirtualFax.tsx:62` | Declaradamente ausente. |
| **LDAP / Microsoft Teams** | Links de navegação em `admin/ExtensionsAdmin.tsx:58` (`/ldap-sync`) e AppSidebar.tsx:59 (`/external-recordings-import`) | Páginas-alvo estão fora deste lote. |
| **Recharts** | `call-analytics/CallsByDayChart.tsx:3`, `SentimentPieChart.tsx:3`, `Reports.tsx:8-21`, `admin/SecurityAuditDashboard.tsx:20` (órfã) | Biblioteca de gráficos, uso normal. |
| **Sonner (toast)** / **date-fns** / **lucide-react** | Transversais | Uso normal. |
| **Gateway de pagamento / billing** | Nenhum | `marketing/Pricing.tsx` publica três planos com preço em BRL e nenhum checkout; todos os CTAs levam a `/register` ou à âncora `/landing#demo`, que não tem formulário. |
