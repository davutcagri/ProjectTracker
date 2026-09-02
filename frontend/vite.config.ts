import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Geliştirme sunucusu :5173'te çalışır.
// "proxy": tarayıcıdan gelen /api istekleri, aynı origin'deymiş gibi
// arka plandaki Spring Boot'a (:8420) iletilir. Böylece CORS ayarına gerek kalmaz.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8420',
        changeOrigin: true,
      },
    },
  },
})
