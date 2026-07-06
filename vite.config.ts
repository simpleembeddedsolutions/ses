import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_STATIC=true builds the backend-free demo (GitHub Pages); VITE_BASE sets
// the subpath it's served from (e.g. /engineering-knowledge-base/).
const IS_STATIC = process.env.VITE_STATIC === 'true'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  define: {
    __STATIC__: JSON.stringify(IS_STATIC),
  },
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
})
