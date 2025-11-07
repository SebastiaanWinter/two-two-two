import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// PWA registration (vite-plugin-pwa)
import { registerSW } from "virtual:pwa-register";

// Let vite-plugin-pwa handle activating the new service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("A new version is ready. Refresh now?")) {
      // 👇 this tells the waiting SW to activate and then reloads once
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("App is ready to work offline");
  },
});

// Render the app
createRoot(document.getElementById("root")).render(
  // StrictMode can cause effects (like timers/audio) to run twice in dev.
  // Keep it commented out for this small PWA so timing stays predictable.
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
