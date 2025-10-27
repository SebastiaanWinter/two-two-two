import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// PWA registration (vite-plugin-pwa)
import { registerSW } from "virtual:pwa-register";

// Registreer de service worker
registerSW({
  // Toon een confirm als er een nieuwe versie klaarstaat
  onNeedRefresh() {
    if (confirm("A new version is ready. Refresh now?")) {
      window.location.reload();
    }
  },
  // Log wanneer de app offline-ready is
  onOfflineReady() {
    console.log("App is ready to work offline");
  },
  // immediate: true // (optioneel) SW meteen activeren zonder wachtfase
});

// Render de app
createRoot(document.getElementById("root")).render(
  // Tip: StrictMode kan in development sommige useEffects dubbel laten lopen.
  // Laat 'm uit tijdens bouwen met timers/audio om rare effecten te voorkomen.
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
