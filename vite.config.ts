import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'logo-source.jpeg', 'pwa-icon.svg'],
      manifest: {
        id: '/',
        name: 'Chess Tournament (Swiss Pairings)',
        short_name: 'Chess Pairings',
        description: 'Run Swiss-system chess tournaments from your phone with local browser storage.',
        theme_color: '#f7f6e5',
        background_color: '#f7f6e5',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo-source.jpeg',
            sizes: '967x1024',
            type: 'image/jpeg',
          },
          {
            src: '/logo-source.jpeg',
            sizes: '967x1024',
            type: 'image/jpeg',
            purpose: 'any',
          },
          {
            src: '/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,ico}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
