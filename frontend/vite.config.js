import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../public',
    emptyOutDir: true
  },
  server: {
    host: '0.0.0.0', // Exposes to local network & public IP
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5050',
        changeOrigin: true
      }
    }
  }
})

