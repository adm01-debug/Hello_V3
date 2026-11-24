import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
 import { AppLayout } from "@/components/layout/AppLayout";
 import { GlobalServices } from "@/components/layout/GlobalServices";
import { AchievementNotificationProvider } from "@/components/gamification/AchievementNotificationProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CallProvider } from "@/contexts/CallContext";
import { ReauthProvider } from "@/contexts/ReauthContext";
import { SessionExpiryProvider } from "@/contexts/SessionExpiryContext";
import { ReauthDialog } from "@/components/auth/ReauthDialog";
import { SessionExpiredDialog } from "@/components/auth/SessionExpiredDialog";
import { isSessionExpiredError, notifySessionExpired } from "@/lib/session-expiry";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SkeletonDashboard } from "@/components/ui/skeleton-loader";
import { ErrorBoundary } from "@/components/error-boundary/ErrorBoundary";
import { publicRoutes } from "@/routes/publicRoutes";
import { protectedRoutes } from "@/routes/protectedRoutes";
import { NavigationProgressMarker } from "@/components/navigation/NavigationProgressMarker";

// Ponto único de erro de autenticação: qualquer consulta ou mutação que volte
// com 401/JWT vencido abre o diálogo de reautenticação em vez de mostrar um
// erro genérico e derrubar o formulário do usuário.
const handleGlobalError = (error: unknown) => {
  if (isSessionExpiredError(error)) notifySessionExpired();
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleGlobalError }),
  mutationCache: new MutationCache({ onError: handleGlobalError }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

function PageFallback() {
  return (
    <>
      <NavigationProgressMarker />
      <SkeletonDashboard />
    </>
  );
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
                          <SessionExpiryProvider>
              <CallProvider>
              <ReauthProvider>
              <Routes>
                {/* Public routes */}
                {publicRoutes.map(({ path, element: Element }) => (
                  <Route
                    key={path}
                    path={path}
                    element={
                      <Suspense fallback={<PageFallback />}>
                        <Element />
                      </Suspense>
                    }
                  />
                ))}

                {/* Protected routes */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AchievementNotificationProvider>
                        {/* Monitoramento de troncos e alertas de qualidade VoIP so
                            faz sentido para quem esta autenticado: montado acima
                            do roteador, rodava tambem nas paginas publicas. */}
                        <GlobalServices />
                        <AppLayout>
                          <Suspense fallback={<PageFallback />}>
                            <Routes>
                              {protectedRoutes.map(({ path, element: Element, roles }) => (
                                <Route
                                  key={path}
                                  path={path}
                                  element={
                                    <ErrorBoundary section={path} compact={false}>
                                      {roles ? (
                                        <ProtectedRoute requiredRoles={roles}>
                                          <Element />
                                        </ProtectedRoute>
                                      ) : (
                                        <Element />
                                      )}
                                    </ErrorBoundary>
                                  }
                                />
                              ))}
                            </Routes>
                          </Suspense>
                        </AppLayout>
                      </AchievementNotificationProvider>
                    </ProtectedRoute>
                  }
                />
              </Routes>
              <ReauthDialog />
                            <SessionExpiredDialog />
              </ReauthProvider>
              </CallProvider>
                            </SessionExpiryProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
