import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AchievementNotificationProvider } from "@/components/gamification/AchievementNotificationProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Contacts from "./pages/Contacts";
import ContactInsights from "./pages/ContactInsights";
import History from "./pages/History";
import Calls from "./pages/Calls";
import AIAssistant from "./pages/AIAssistant";
import Voice from "./pages/Voice";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import CallHistory from "./pages/CallHistory";
import CallAnalytics from "./pages/CallAnalytics";
import Alerts from "./pages/Alerts";
import AgentRanking from "./pages/AgentRanking";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import Recordings from "./pages/Recordings";
import HoldMetrics from "./pages/HoldMetrics";
import HoldAlerts from "./pages/HoldAlerts";
import HoldAlertSettings from "./pages/HoldAlertSettings";
import Callbacks from "./pages/Callbacks";
import Dialer from "./pages/Dialer";
import Coaching from "./pages/Coaching";
import QueueMetricsAlertSettings from "./pages/QueueMetricsAlertSettings";
import AlertHistory from "./pages/AlertHistory";
import QueueMetricsDashboard from "./pages/QueueMetricsDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import AuditLogs from "./pages/AuditLogs";
import SecurityReport from "./pages/SecurityReport";
import SecurityMonitoring from "./pages/SecurityMonitoring";
import IPWhitelist from "./pages/IPWhitelist";
import BlockedAccessLogs from "./pages/BlockedAccessLogs";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import TwoFactorAuth from "./pages/TwoFactorAuth";
import Passkeys from "./pages/Passkeys";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import RateLimitDashboard from "./pages/RateLimitDashboard";
import SessionManagement from "./pages/SessionManagement";
import SecurityDashboard from "./pages/SecurityDashboard";
import GeoBlocking from "./pages/GeoBlocking";
import PasswordResetApproval from "./pages/PasswordResetApproval";
import Compliance from "./pages/Compliance";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="dark">
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected routes */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <AchievementNotificationProvider>
                    <AppLayout>
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
                        <Route path="/voice" element={<Voice />} />
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
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </AchievementNotificationProvider>
                </ProtectedRoute>
              } />
            </Routes>
          </AuthProvider>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
