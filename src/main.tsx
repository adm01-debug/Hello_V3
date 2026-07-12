import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorTracking } from "./lib/error-tracking";
import { initWebVitals } from "./lib/web-vitals";
import { logger } from "./lib/logger";
import { supabase } from "./integrations/supabase/client";
// Initialize global error tracking & web vitals
initErrorTracking();
initWebVitals();

// Forward webhook queue flush metrics to structured logger + persist for BI
if (typeof window !== "undefined") {
  window.addEventListener("lovable:webhook-queue-flush", (event: Event) => {
    const detail = ((event as CustomEvent).detail ?? {}) as Record<string, unknown>;
    logger.info("webhook_queue_flush", detail);

    // Fire-and-forget insert; RLS restricts read to admins/supervisors
    void supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      void supabase.from("webhook_flush_metrics").insert({
        user_id: uid,
        pending_before: Number(detail.pending_before ?? 0),
        sent: Number(detail.sent ?? 0),
        failed: Number(detail.failed ?? 0),
        remaining: Number(detail.remaining ?? 0),
        oldest_age_ms: Number(detail.oldest_age_ms ?? 0),
        duration_ms: Number(detail.duration_ms ?? 0),
      });
    });
  });
}



// Clean mount
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
