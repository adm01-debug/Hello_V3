import { Suspense } from "react";
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
import { publicRoutes } from "@/routes/publicRoutes";
import { protectedRoutes } from "@/routes/protectedRoutes";

const queryClient = new QueryClient({
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
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
