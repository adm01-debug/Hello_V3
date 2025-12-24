import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AchievementNotificationProvider } from "@/components/gamification/AchievementNotificationProvider";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="dark">
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
                <Route path="/ranking" element={<AgentRanking />} />
                <Route path="/executive" element={<ExecutiveDashboard />} />
                <Route path="/ai" element={<AIAssistant />} />
                <Route path="/voice" element={<Voice />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/recordings" element={<Recordings />} />
                <Route path="/hold-metrics" element={<HoldMetrics />} />
                <Route path="/hold-alerts" element={<HoldAlerts />} />
                <Route path="/hold-settings" element={<HoldAlertSettings />} />
                <Route path="/callbacks" element={<Callbacks />} />
                <Route path="/dialer" element={<Dialer />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </AchievementNotificationProvider>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
