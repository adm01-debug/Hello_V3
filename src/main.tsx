import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorTracking } from "./lib/error-tracking";
import { initWebVitals } from "./lib/web-vitals";

// Initialize global error tracking & web vitals
initErrorTracking();
initWebVitals();

// Clean mount
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
