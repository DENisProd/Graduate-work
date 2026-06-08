import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const localBackend = process.env.VITE_LOCAL_SERVER_URL?.trim() || 'http://localhost:8080'
const accessGateway = process.env.VITE_ACCESS_SERVICE_URL?.trim() || 'http://localhost:8082'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/api/access': accessGateway,
      '/api': localBackend,
      '/socket.io': { target: localBackend, ws: true },
    },
  },
})
