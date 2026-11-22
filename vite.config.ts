import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Use app.html as entry — index.html is now the PWA landing page
  root: '.',
  build: {
    rollupOptions: {
      input: 'app.html',
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
