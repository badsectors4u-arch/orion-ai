import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    // In production (Docker Compose) nginx proxies /api/ to the backend
    // container. For `npm run dev` outside Docker, proxy the same path to
    // a locally running backend so the frontend code never needs to know
    // the difference.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
