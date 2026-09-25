import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      // Proxy untuk HTTP API biasa (Express/Node.js backend)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Proxy untuk Socket.IO
      '/socket.io': {
        target: 'http://localhost:3001', // Gunakan http/https, Vite bakal handle upgrade ke WS otomatis
        ws: true,
        changeOrigin: true,
      },
      // Proxy untuk Native WebSocket
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
  },
})