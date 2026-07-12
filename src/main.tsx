import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorTracking } from "./lib/error-tracking";
import { initWebVitals } from "./lib/web-vitals";
import { logger } from "./lib/logger";
// Initialize global error tracking & web vitals
initErrorTracking();
initWebVitals();

// Forward webhook queue flush metrics to structured logger for external dashboards
if (typeof window !== "undefined") {
  window.addEventListener("lovable:webhook-queue-flush", (event: Event) => {
    const detail = (event as CustomEvent).detail ?? {};
    logger.info("webhook_queue_flush", detail);
  });
}


// Clean mount
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
