import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// PWA registration (vite-plugin-pwa)
import { registerSW } from "virtual:pwa-register";

// Automatic service worker updates - no user prompt needed
const updateSW = registerSW({
  immediate: true, // Register SW immediately
  onNeedRefresh() {
    console.log("New version available! Updating automatically...");
    // Automatically update without asking the user
    updateSW(true);
  },
  onOfflineReady() {
    console.log("App is ready to work offline");
  },
  onRegistered(registration) {
    console.log("Service Worker registered successfully");
    // Check for updates every hour
    if (registration) {
      setInterval(() => {
        console.log("Checking for updates...");
        registration.update();
      }, 60 * 60 * 1000); // Check every hour
    }
  },
  onRegisterError(error) {
    console.error("Service Worker registration failed:", error);
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