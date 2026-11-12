import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy membuat cookie sesi bersifat same-origin saat development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
});
