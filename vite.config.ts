import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' membuat situs berjalan di mana saja:
// https://<user>.github.io/df-sabiku/ maupun domain sendiri.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
})
