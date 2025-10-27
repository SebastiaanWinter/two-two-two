// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const repo = "two-two-two"; // <-- your GitHub repo name

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? `/${repo}/` : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "Alleah-500.png"],
      manifest: {
        name: "2-2-2 Morning Routine",
        short_name: "2-2-2",
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#f4846c",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" }
        ]
      }
    })
  ]
});
