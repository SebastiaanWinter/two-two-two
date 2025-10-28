import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = '/two-two-two/' // 👈 very important

export default defineConfig({
  base: '/two-two-two/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: '2-2-2 Morning Routine',
        short_name: '2-2-2',
        start_url: base,          // 👈 ensures correct path when installed
        scope: base,              // 👈 keeps navigation within the app
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#f97316',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
    }),
  ],
})
