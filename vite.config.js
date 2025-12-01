import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Optional: Alias @ to src if you prefer absolute imports
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    open: true // Opens browser automatically on npm run dev
  }
})