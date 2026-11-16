
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Local development proxy for Baraza backend services.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/customer-applications': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/accounts': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/transactions': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/transfers': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/transfers/, '/api/transactions'),
      },
    },
  },
})
