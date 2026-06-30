import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL || 'http://localhost:8000'

  return {
    plugins: [react()],

    // './' makes asset paths relative — required for Tauri & Capacitor file:// loading.
    // Safe for web too: this app never deep-links via real URLs (all nav is in-state).
    base: './',

    server: {
      port: 3000,
      host: '0.0.0.0',
      watch: { usePolling: true, interval: 300 },   // needed for Windows Docker volume mounts
      proxy: {
        '/api':   { target: backendUrl, changeOrigin: true },
        '/files': { target: backendUrl, changeOrigin: true },
      },
    },

    build: {
      outDir: '../frontend',   // unchanged — backend still serves from this path
      emptyOutDir: true,
    },

    // Required for Tauri's IPC bridge to initialise
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_'],
  }
})
