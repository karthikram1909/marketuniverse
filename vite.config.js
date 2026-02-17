/* eslint-disable no-undef */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from "path"
import { fileURLToPath } from "url"

// Define __dirname for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0', // Expose to network
    port: 5174,      // New port to avoid 5173 conflicts
    strictPort: false, // If 5174 is taken, try 5175
  },
});