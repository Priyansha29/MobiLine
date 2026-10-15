import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Recharts is by far the heaviest dependency and changes far less often
    // than the app code, so it gets its own long-lived chunk.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'charts', test: /node_modules[\\/]recharts/ }],
        },
      },
    },
  },
})