import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isLocal = process.env.VITE_RUN_ENV === 'local';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 5173,
  },
})
