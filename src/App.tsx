import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AchievementNotificationProvider } from "@/components/gamification/AchievementNotificationProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SkeletonDashboard } from "@/components/ui/skeleton-loader";
import { ErrorBoundary } from "@/components/error-boundary/ErrorBoundary";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const Contacts = lazy(() => import("./pages/Contacts"));
const ContactInsights = lazy(() => import("./pages/ContactInsights"));
const History = lazy(() => import("./pages/History"));
const Calls = lazy(() => import("./pages/Calls"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const CallHistory = lazy(() => import("./pages/CallHistory"));
const CallAnalytics = lazy(() => import("./pages/CallAnalytics"));
const Alerts = lazy(() => import("./pages/Alerts"));
const AgentRanking = lazy(() => import("./pages/AgentRanking"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const Recordings = lazy(() => import("./pages/Recordings"));
const HoldMetrics = lazy(() => import("./pages/HoldMetrics"));
const HoldAlerts = lazy(() => import("./pages/HoldAlerts"));
const HoldAlertSettings = lazy(() => import("./pages/HoldAlertSettings"));
const Callbacks = lazy(() => import("./pages/Callbacks"));
const Dialer = lazy(() => import("./pages/Dialer"));
const Coaching = lazy(() => import("./pages/Coaching"));
const QueueMetricsAlertSettings = lazy(() => import("./pages/QueueMetricsAlertSettings"));
const AlertHistory = lazy(() => import("./pages/AlertHistory"));
const QueueMetricsDashboard = lazy(() => import("./pages/QueueMetricsDashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const SecurityReport = lazy(() => import("./pages/SecurityReport"));
const SecurityMonitoring = lazy(() => import("./pages/SecurityMonitoring"));
const IPWhitelist = lazy(() => import("./pages/IPWhitelist"));
const BlockedAccessLogs = lazy(() => import("./pages/BlockedAccessLogs"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const TwoFactorAuth = lazy(() => import("./pages/TwoFactorAuth"));
const Passkeys = lazy(() => import("./pages/Passkeys"));
const Roles = lazy(() => import("./pages/Roles"));
const Permissions = lazy(() => import("./pages/Permissions"));
const RateLimitDashboard = lazy(() => import("./pages/RateLimitDashboard"));
const SessionManagement = lazy(() => import("./pages/SessionManagement"));
const SecurityDashboard = lazy(() => import("./pages/SecurityDashboard"));
const GeoBlocking = lazy(() => import("./pages/GeoBlocking"));
const PasswordResetApproval = lazy(() => import("./pages/PasswordResetApproval"));
const Compliance = lazy(() => import("./pages/Compliance"));
const CallFlowDesigner = lazy(() => import("./pages/CallFlowDesigner"));
const Voicemail = lazy(() => import("./pages/Voicemail"));
const TopicDetection = lazy(() => import("./pages/TopicDetection"));
const VideoConference = lazy(() => import("./pages/VideoConference"));
const HotDesking = lazy(() => import("./pages/HotDesking"));
const VirtualFax = lazy(() => import("./pages/VirtualFax"));
const NumberPorting = lazy(() => import("./pages/NumberPorting"));
const TollFreeNumbers = lazy(() => import("./pages/TollFreeNumbers"));
const MultiDeviceRing = lazy(() => import("./pages/MultiDeviceRing"));
const QRProvisioning = lazy(() => import("./pages/QRProvisioning"));
const LDAPSync = lazy(() => import("./pages/LDAPSync"));

const queryClient = new QueryClient();

function PageFallback() {
  return <SkeletonDashboard />;
}

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Suspense fallback={<PageFallback />}><Login /></Suspense>} />
              <Route path="/register" element={<Suspense fallback={<PageFallback />}><Register /></Suspense>} />
              <Route path="/forgot-password" element={<Suspense fallback={<PageFallback />}><ForgotPassword /></Suspense>} />
              <Route path="/reset-password" element={<Suspense fallback={<PageFallback />}><ResetPassword /></Suspense>} />
              <Route path="/verify-email" element={<Suspense fallback={<PageFallback />}><VerifyEmail /></Suspense>} />
              <Route path="/unauthorized" element={<Suspense fallback={<PageFallback />}><Unauthorized /></Suspense>} />
              
              {/* Protected routes */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <AchievementNotificationProvider>
                    <AppLayout>
                      <Suspense fallback={<PageFallback />}>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/calls" element={<Calls />} />
                          <Route path="/contacts" element={<Contacts />} />
                          <Route path="/contacts/insights" element={<ContactInsights />} />
                          <Route path="/history" element={<History />} />
                          <Route path="/call-history" element={<CallHistory />} />
                          <Route path="/analytics" element={<CallAnalytics />} />
                          <Route path="/alerts" element={<Alerts />} />
                          <Route path="/alert-history" element={<AlertHistory />} />
                          <Route path="/queue-dashboard" element={
                            <ProtectedRoute requiredRoles={['supervisor', 'admin']}>
                              <QueueMetricsDashboard />
                            </ProtectedRoute>
                          } />
                          <Route path="/ranking" element={<AgentRanking />} />
                          <Route path="/executive" element={
                            <ProtectedRoute requiredRoles={['supervisor', 'admin']}>
                              <ExecutiveDashboard />
                            </ProtectedRoute>
                          } />
                          <Route path="/ai" element={<AIAssistant />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/recordings" element={<Recordings />} />
                          <Route path="/hold-metrics" element={<HoldMetrics />} />
                          <Route path="/hold-alerts" element={<HoldAlerts />} />
                          <Route path="/hold-settings" element={<HoldAlertSettings />} />
                          <Route path="/queue-metrics-settings" element={
                            <ProtectedRoute requiredRoles={['supervisor', 'admin']}>
                              <QueueMetricsAlertSettings />
                            </ProtectedRoute>
                          } />
                          <Route path="/callbacks" element={<Callbacks />} />
                          <Route path="/dialer" element={
                            <ProtectedRoute requiredRoles={['supervisor', 'admin']}>
                              <Dialer />
                            </ProtectedRoute>
                          } />
                          <Route path="/coaching" element={<Coaching />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/two-factor-auth" element={<TwoFactorAuth />} />
                          <Route path="/passkeys" element={<Passkeys />} />
                          <Route path="/sessions" element={<SessionManagement />} />
                          <Route path="/security" element={<SecurityDashboard />} />
                          <Route path="/audit-logs" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                              <AuditLogs />
                            </ProtectedRoute>
                          } />
                          <Route path="/security-report" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                              <SecurityReport />
                            </ProtectedRoute>
                          } />
                          <Route path="/security-monitoring" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                              <SecurityMonitoring />
                            </ProtectedRoute>
                          } />
                          <Route path="/ip-whitelist" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                              <IPWhitelist />
                            </ProtectedRoute>
                          } />
                          <Route path="/blocked-access-logs" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                              <BlockedAccessLogs />
                            </ProtectedRoute>
                          } />
                          <Route path="/roles" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                              <Roles />
                            </ProtectedRoute>
                          } />
                          <Route path="/permissions" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                              <Permissions />
                            </ProtectedRoute>
                          } />
                          <Route path="/rate-limit" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                              <RateLimitDashboard />
                            </ProtectedRoute>
                          } />
                          <Route path="/geo-blocking" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                              <GeoBlocking />
                            </ProtectedRoute>
                          } />
                          <Route path="/password-reset-approval" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                              <PasswordResetApproval />
                            </ProtectedRoute>
                          } />
                          <Route path="/compliance" element={
                            <ProtectedRoute requiredRoles={['supervisor', 'admin']}>
                              <Compliance />
                            </ProtectedRoute>
                          } />
                          <Route path="/call-flow-designer" element={
                            <ProtectedRoute requiredRoles={['supervisor', 'admin']}>
                              <CallFlowDesigner />
                            </ProtectedRoute>
                          } />
                          <Route path="/voicemail" element={<Voicemail />} />
                          <Route path="/topic-detection" element={
                            <ProtectedRoute requiredRoles={['supervisor', 'admin']}>
                              <TopicDetection />
                            </ProtectedRoute>
                          } />
                          <Route path="/video-conference" element={<VideoConference />} />
                          <Route path="/hot-desking" element={<HotDesking />} />
                          <Route path="/virtual-fax" element={<VirtualFax />} />
                          <Route path="/number-porting" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                              <NumberPorting />
                            </ProtectedRoute>
                          } />
                          <Route path="/toll-free-numbers" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                              <TollFreeNumbers />
                            </ProtectedRoute>
                          } />
                          <Route path="/multi-device-ring" element={<MultiDeviceRing />} />
                          <Route path="/qr-provisioning" element={
                            <ProtectedRoute requiredRoles={['supervisor', 'admin']}>
                              <QRProvisioning />
                            </ProtectedRoute>
                          } />
                          <Route path="/ldap-sync" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                              <LDAPSync />
                            </ProtectedRoute>
                          } />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </AppLayout>
                  </AchievementNotificationProvider>
                </ProtectedRoute>
              } />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
