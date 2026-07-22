import { lazy } from "react";
import type { UserRole } from "@/hooks/useAuth";

const Index = lazy(() => import("@/pages/Index"));
const Contacts = lazy(() => import("@/pages/Contacts"));
const ContactInsights = lazy(() => import("@/pages/ContactInsights"));
 const Calls = lazy(() => import("@/pages/Calls"));
 const AIAssistant = lazy(() => import("@/pages/AIAssistant"));
 const Reports = lazy(() => import("@/pages/Reports"));
 const Settings = lazy(() => import("@/pages/Settings"));
 const CallHistory = lazy(() => import("@/pages/CallHistory"));
const CallAnalytics = lazy(() => import("@/pages/CallAnalytics"));
const Alerts = lazy(() => import("@/pages/Alerts"));
const AgentRanking = lazy(() => import("@/pages/AgentRanking"));
const ExecutiveDashboard = lazy(() => import("@/pages/ExecutiveDashboard"));
const Recordings = lazy(() => import("@/pages/Recordings"));
const HoldMetrics = lazy(() => import("@/pages/HoldMetrics"));
const HoldAlerts = lazy(() => import("@/pages/HoldAlerts"));
const HoldAlertSettings = lazy(() => import("@/pages/HoldAlertSettings"));
const Callbacks = lazy(() => import("@/pages/Callbacks"));
const Dialer = lazy(() => import("@/pages/Dialer"));
const Coaching = lazy(() => import("@/pages/Coaching"));
const QueueMetricsAlertSettings = lazy(() => import("@/pages/QueueMetricsAlertSettings"));
const AlertHistory = lazy(() => import("@/pages/AlertHistory"));
const QueueMetricsDashboard = lazy(() => import("@/pages/QueueMetricsDashboard"));
const AuditLogs = lazy(() => import("@/pages/AuditLogs"));
const SecurityReport = lazy(() => import("@/pages/SecurityReport"));
const SecurityMonitoring = lazy(() => import("@/pages/SecurityMonitoring"));
const IPWhitelist = lazy(() => import("@/pages/IPWhitelist"));
const BlockedAccessLogs = lazy(() => import("@/pages/BlockedAccessLogs"));
const TwoFactorAuth = lazy(() => import("@/pages/TwoFactorAuth"));
const Passkeys = lazy(() => import("@/pages/Passkeys"));
const Roles = lazy(() => import("@/pages/Roles"));
const Permissions = lazy(() => import("@/pages/Permissions"));
const RateLimitDashboard = lazy(() => import("@/pages/RateLimitDashboard"));
const SessionManagement = lazy(() => import("@/pages/SessionManagement"));
const SecurityDashboard = lazy(() => import("@/pages/SecurityDashboard"));
const GeoBlocking = lazy(() => import("@/pages/GeoBlocking"));
const PasswordResetApproval = lazy(() => import("@/pages/PasswordResetApproval"));
const Compliance = lazy(() => import("@/pages/Compliance"));
const CallFlowDesigner = lazy(() => import("@/pages/CallFlowDesigner"));
const Voicemail = lazy(() => import("@/pages/Voicemail"));
const TopicDetection = lazy(() => import("@/pages/TopicDetection"));
const VideoConference = lazy(() => import("@/pages/VideoConference"));
const HotDesking = lazy(() => import("@/pages/HotDesking"));
const VirtualFax = lazy(() => import("@/pages/VirtualFax"));
const NumberPorting = lazy(() => import("@/pages/NumberPorting"));
const TollFreeNumbers = lazy(() => import("@/pages/TollFreeNumbers"));
const MultiDeviceRing = lazy(() => import("@/pages/MultiDeviceRing"));
const QRProvisioning = lazy(() => import("@/pages/QRProvisioning"));
const LDAPSync = lazy(() => import("@/pages/LDAPSync"));
const ObservabilityDashboard = lazy(() => import("@/pages/ObservabilityDashboard"));
const NetworkDiagnostics = lazy(() => import("@/pages/NetworkDiagnostics"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const NotificationCenter = lazy(() => import("@/pages/NotificationCenter"));
const CallLibrary = lazy(() => import("@/pages/CallLibrary"));
const BattleCards = lazy(() => import("@/pages/BattleCards"));
const ExternalRecordingsImport = lazy(() => import("@/pages/ExternalRecordingsImport"));
const Deals = lazy(() => import("@/pages/Deals"));
const Cadences = lazy(() => import("@/pages/Cadences"));
const Trackers = lazy(() => import("@/pages/Trackers"));
const Accounts = lazy(() => import("@/pages/Accounts"));
const Renewals = lazy(() => import("@/pages/Renewals"));
const SuccessPlans = lazy(() => import("@/pages/SuccessPlans"));
const Scheduling = lazy(() => import("@/pages/Scheduling"));
const Skills = lazy(() => import("@/pages/Skills"));
const Learning = lazy(() => import("@/pages/Learning"));
const MeetingSummaries = lazy(() => import("@/pages/MeetingSummaries"));
const AgentAssist = lazy(() => import("@/pages/AgentAssist"));
const VoiceSecurity = lazy(() => import("@/pages/VoiceSecurity"));
const OutboundCompliance = lazy(() => import("@/pages/OutboundCompliance"));
const TranslationCenter = lazy(() => import("@/pages/TranslationCenter"));
const Inbox = lazy(() => import("@/pages/Inbox"));
const Knowledge = lazy(() => import("@/pages/Knowledge"));
const RoutingRules = lazy(() => import("@/pages/RoutingRules"));
const SLAPolicies = lazy(() => import("@/pages/SLAPolicies"));
const ConcurrencyConflicts = lazy(() => import("@/pages/ConcurrencyConflicts"));
const VoipTrunksAdmin = lazy(() => import("@/pages/admin/VoipTrunksAdmin"));
const ExtensionsAdmin = lazy(() => import("@/pages/admin/ExtensionsAdmin"));
const SecurityAudit = lazy(() => import("@/pages/admin/SecurityDashboard"));
const FinancialImpact = lazy(() => import("@/pages/FinancialImpact"));
const ShiftSwapSuggestions = lazy(() => import("@/pages/ShiftSwapSuggestions"));
const DataExport = lazy(() => import("@/pages/admin/DataExport"));
const DatabaseHealth = lazy(() => import("@/pages/admin/DatabaseHealth"));
const SecurityAlerts = lazy(() => import("@/pages/admin/SecurityAlerts"));
const WebhookHealth = lazy(() => import("@/pages/admin/WebhookHealth"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const PredictiveDialer = lazy(() => import("@/pages/PredictiveDialer"));
const VoiceQuality = lazy(() => import("@/pages/admin/VoiceQuality"));

export interface RouteConfig {
  path: string;
  element: React.LazyExoticComponent<React.ComponentType>;
  roles?: UserRole[];
}

export const protectedRoutes: RouteConfig[] = [
  // General
  { path: "/", element: Index },
  { path: "/onboarding", element: Onboarding },
  { path: "/calls", element: Calls },
  { path: "/contacts", element: Contacts },
  { path: "/contacts/insights", element: ContactInsights },
   { path: "/history", element: CallHistory },
   { path: "/call-history", element: CallHistory },
  { path: "/analytics", element: CallAnalytics },
  { path: "/alerts", element: Alerts },
  { path: "/alert-history", element: AlertHistory },
  { path: "/ranking", element: AgentRanking },
  { path: "/ai", element: AIAssistant },
  { path: "/reports", element: Reports },
  { path: "/recordings", element: Recordings },
  { path: "/hold-metrics", element: HoldMetrics },
  { path: "/hold-alerts", element: HoldAlerts },
  { path: "/hold-settings", element: HoldAlertSettings },
  { path: "/callbacks", element: Callbacks },
  { path: "/coaching", element: Coaching },
  { path: "/settings", element: Settings },
  { path: "/notifications", element: NotificationCenter },
  { path: "/two-factor-auth", element: TwoFactorAuth },
  { path: "/passkeys", element: Passkeys },
  { path: "/sessions", element: SessionManagement },
  { path: "/security", element: SecurityDashboard },
  { path: "/voicemail", element: Voicemail },
  { path: "/video-conference", element: VideoConference },
  { path: "/hot-desking", element: HotDesking },
  { path: "/virtual-fax", element: VirtualFax },
  { path: "/multi-device-ring", element: MultiDeviceRing },
  { path: "/call-library", element: CallLibrary },
  { path: "/battle-cards", element: BattleCards, roles: ["supervisor", "admin"] },
  { path: "/external-recordings-import", element: ExternalRecordingsImport, roles: ["supervisor", "admin"] },
  { path: "/deals", element: Deals },
  { path: "/cadences", element: Cadences, roles: ["supervisor", "admin"] },
  { path: "/trackers", element: Trackers, roles: ["supervisor", "admin"] },
  { path: "/accounts", element: Accounts },
  { path: "/renewals", element: Renewals },
  { path: "/success-plans", element: SuccessPlans },
  { path: "/scheduling", element: Scheduling, roles: ["supervisor", "admin"] },
  { path: "/skills", element: Skills, roles: ["supervisor", "admin"] },
  { path: "/learning", element: Learning },
  { path: "/meeting-summaries", element: MeetingSummaries },
  { path: "/agent-assist", element: AgentAssist },
  { path: "/voice-security", element: VoiceSecurity },
  { path: "/translation-center", element: TranslationCenter },
  { path: "/inbox", element: Inbox },
  { path: "/knowledge", element: Knowledge },
  { path: "/routing-rules", element: RoutingRules, roles: ["supervisor", "admin"] },
  { path: "/sla-policies", element: SLAPolicies, roles: ["supervisor", "admin"] },

  // Supervisor + Admin
  { path: "/queue-dashboard", element: QueueMetricsDashboard, roles: ["supervisor", "admin"] },
  { path: "/executive", element: ExecutiveDashboard, roles: ["supervisor", "admin"] },
  { path: "/queue-metrics-settings", element: QueueMetricsAlertSettings, roles: ["supervisor", "admin"] },
  { path: "/dialer", element: Dialer, roles: ["supervisor", "admin"] },
  { path: "/dialer/predictive", element: PredictiveDialer, roles: ["supervisor", "admin"] },
  { path: "/admin/voice-quality", element: VoiceQuality, roles: ["supervisor", "admin"] },
  { path: "/compliance", element: Compliance, roles: ["supervisor", "admin"] },
  { path: "/outbound-compliance", element: OutboundCompliance, roles: ["supervisor", "admin"] },
  { path: "/call-flow-designer", element: CallFlowDesigner, roles: ["supervisor", "admin"] },
  { path: "/topic-detection", element: TopicDetection, roles: ["supervisor", "admin"] },
  { path: "/qr-provisioning", element: QRProvisioning, roles: ["supervisor", "admin"] },

  // Admin only
  { path: "/audit-logs", element: AuditLogs, roles: ["admin"] },
  { path: "/security-report", element: SecurityReport, roles: ["admin"] },
  { path: "/security-monitoring", element: SecurityMonitoring, roles: ["admin"] },
  { path: "/ip-whitelist", element: IPWhitelist, roles: ["admin"] },
  { path: "/blocked-access-logs", element: BlockedAccessLogs, roles: ["admin"] },
  { path: "/roles", element: Roles, roles: ["admin"] },
  { path: "/permissions", element: Permissions, roles: ["admin"] },
  { path: "/rate-limit", element: RateLimitDashboard, roles: ["admin"] },
  { path: "/geo-blocking", element: GeoBlocking, roles: ["admin"] },
  { path: "/password-reset-approval", element: PasswordResetApproval, roles: ["admin"] },
  { path: "/number-porting", element: NumberPorting, roles: ["admin"] },
  { path: "/toll-free-numbers", element: TollFreeNumbers, roles: ["admin"] },
  { path: "/ldap-sync", element: LDAPSync, roles: ["admin"] },
  { path: "/observability", element: ObservabilityDashboard, roles: ["admin"] },
  { path: "/network-diagnostics", element: NetworkDiagnostics, roles: ["supervisor", "admin"] },
  { path: "/concurrency-conflicts", element: ConcurrencyConflicts, roles: ["supervisor", "admin"] },
  { path: "/admin/voip-trunks", element: VoipTrunksAdmin, roles: ["admin"] },
  { path: "/admin/extensions", element: ExtensionsAdmin, roles: ["admin"] },
  { path: "/admin/security-audit", element: SecurityAudit, roles: ["admin"] },
  { path: "/financial-impact", element: FinancialImpact, roles: ["supervisor", "admin"] },
  { path: "/shift-swap-suggestions", element: ShiftSwapSuggestions, roles: ["supervisor", "admin"] },
  { path: "/admin/data-export", element: DataExport, roles: ["admin"] },
  { path: "/admin/database-health", element: DatabaseHealth, roles: ["admin"] },
  { path: "/admin/security-alerts", element: SecurityAlerts, roles: ["admin"] },
  { path: "/admin/webhook-health", element: WebhookHealth, roles: ["admin"] },

  // Catch-all
  { path: "*", element: NotFound },
];
