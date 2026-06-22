import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    watch: { usePolling: true, interval: 300 },   // needed for Windows Docker volume mounts
    proxy: {
      '/api': process.env.VITE_BACKEND_URL || 'http://localhost:8000',
      '/files': process.env.VITE_BACKEND_URL || 'http://localhost:8000',
    },
  },
  build: {
    outDir: '../frontend',
    emptyOutDir: true,
  },
})
