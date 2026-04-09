import { lazy } from "react";
import type { UserRole } from "@/hooks/useAuth";

const Index = lazy(() => import("@/pages/Index"));
const Contacts = lazy(() => import("@/pages/Contacts"));
const ContactInsights = lazy(() => import("@/pages/ContactInsights"));
const History = lazy(() => import("@/pages/History"));
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
const NotFound = lazy(() => import("@/pages/NotFound"));
const NotificationCenter = lazy(() => import("@/pages/NotificationCenter"));

export interface RouteConfig {
  path: string;
  element: React.LazyExoticComponent<React.ComponentType>;
  roles?: UserRole[];
}

export const protectedRoutes: RouteConfig[] = [
  // General
  { path: "/", element: Index },
  { path: "/calls", element: Calls },
  { path: "/contacts", element: Contacts },
  { path: "/contacts/insights", element: ContactInsights },
  { path: "/history", element: History },
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
  { path: "/two-factor-auth", element: TwoFactorAuth },
  { path: "/passkeys", element: Passkeys },
  { path: "/sessions", element: SessionManagement },
  { path: "/security", element: SecurityDashboard },
  { path: "/voicemail", element: Voicemail },
  { path: "/video-conference", element: VideoConference },
  { path: "/hot-desking", element: HotDesking },
  { path: "/virtual-fax", element: VirtualFax },
  { path: "/multi-device-ring", element: MultiDeviceRing },

  // Supervisor + Admin
  { path: "/queue-dashboard", element: QueueMetricsDashboard, roles: ["supervisor", "admin"] },
  { path: "/executive", element: ExecutiveDashboard, roles: ["supervisor", "admin"] },
  { path: "/queue-metrics-settings", element: QueueMetricsAlertSettings, roles: ["supervisor", "admin"] },
  { path: "/dialer", element: Dialer, roles: ["supervisor", "admin"] },
  { path: "/compliance", element: Compliance, roles: ["supervisor", "admin"] },
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

  // Catch-all
  { path: "*", element: NotFound },
];
