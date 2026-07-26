/**
 * Route prefetch inteligente.
 * Cada entrada mapeia um path para o import dinâmico do chunk correspondente,
 * permitindo hover-prefetch (baixa o chunk antes do clique).
 *
 * Mantém-se em sync manual com src/routes/protectedRoutes.tsx — só é preciso
 * adicionar entradas para rotas críticas/frequentes.
 */

type Loader = () => Promise<unknown>;

const prefetched = new Set<string>();

const loaders: Record<string, Loader> = {
  "/": () => import("@/pages/PhoneDialer"),
  "/dashboard": () => import("@/pages/Index"),
  "/executive": () => import("@/pages/ExecutiveDashboard"),
  "/queue-dashboard": () => import("@/pages/QueueMetricsDashboard"),
  "/calls": () => import("@/pages/Calls"),
  "/dialer": () => import("@/pages/Dialer"),
  "/contacts": () => import("@/pages/Contacts"),
  "/contacts/insights": () => import("@/pages/ContactInsights"),
  "/history": () => import("@/pages/CallHistory"),
  "/call-history": () => import("@/pages/CallHistory"),
  "/ai": () => import("@/pages/AIAssistant"),
  "/coaching": () => import("@/pages/Coaching"),
  "/voicemail": () => import("@/pages/Voicemail"),
  "/video-conference": () => import("@/pages/VideoConference"),
  "/callbacks": () => import("@/pages/Callbacks"),
  "/recordings": () => import("@/pages/Recordings"),
  "/analytics": () => import("@/pages/CallAnalytics"),
  "/alerts": () => import("@/pages/Alerts"),
  "/ranking": () => import("@/pages/AgentRanking"),
  "/reports": () => import("@/pages/Reports"),
  "/inbox": () => import("@/pages/Inbox"),
  "/knowledge": () => import("@/pages/Knowledge"),
  "/deals": () => import("@/pages/Deals"),
  "/accounts": () => import("@/pages/Accounts"),
  "/renewals": () => import("@/pages/Renewals"),
  "/meeting-summaries": () => import("@/pages/MeetingSummaries"),
  "/settings": () => import("@/pages/Settings"),
  "/financial-impact": () => import("@/pages/FinancialImpact"),
};

export function prefetchRoute(path: string): void {
  if (prefetched.has(path)) return;
  const loader = loaders[path];
  if (!loader) return;
  prefetched.add(path);
  // fire-and-forget; erros são silenciosos (import falho será re-tentado no clique)
  loader().catch(() => prefetched.delete(path));
}

/**
 * Handlers prontos para uso em <NavLink> / <a>:
 *   <NavLink to="/calls" {...prefetchHandlers("/calls")}>
 */
export function prefetchHandlers(path: string) {
  return {
    onMouseEnter: () => prefetchRoute(path),
    onFocus: () => prefetchRoute(path),
    onTouchStart: () => prefetchRoute(path),
  };
}
