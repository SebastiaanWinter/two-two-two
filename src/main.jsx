import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// PWA registration (vite-plugin-pwa)
import { registerSW } from "virtual:pwa-register";

// Register service worker with update handling
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("A new version is ready. Refresh now?")) {
      updateSW(); // Call the updater function to activate new service worker
    }
  },
  onOfflineReady() {
    console.log("App is ready to work offline");
  }
});

// Render the app
createRoot(document.getElementById("root")).render(
  // StrictMode can cause useEffects to run twice in development.
  // Keep it disabled while building with timers/audio to prevent odd behavior.
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);