import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3030,
  },
  preview: {
    port: 8080,
  },
  plugins: [react()],
})
