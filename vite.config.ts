import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
/* export default defineConfig({
  plugins: [react()],server: {
    allowedHosts: [
      'localhost',
      'ecs.ewingoutdoorsupply.com',
    ],
  },
}) */

// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/graphql': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
