import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/podcast-player/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'gettysburg_cover.png', 'inaugural_cover.png', 'subtitles_ep1.vtt', 'subtitles_ep2.vtt'],
      manifest: {
        name: 'naiza - Interactive Subtitles',
        short_name: 'naiza',
        description: 'Listen to premium podcast episodes with interactive synced transcripts.',
        theme_color: '#0b0f19',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true
  }
})
