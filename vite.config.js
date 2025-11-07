import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/two-two-two/', // Your GitHub Pages path
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically update without prompting
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        // Clean old caches automatically
        cleanupOutdatedCaches: true,
        // Network first for HTML to always get fresh updates
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: '2-2-2 Morning Routine',
        short_name: '2-2-2',
        description: 'FLOW Program by Law of Attraction with Alleah',
        theme_color: '#f97316',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/two-two-two/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/two-two-two/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true, // Enable PWA in development mode for testing
        type: 'module'
      }
    })
  ]
})