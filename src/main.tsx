import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorTracking } from "./lib/error-tracking";

// Initialize global error tracking
initErrorTracking();

// Clean mount
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
