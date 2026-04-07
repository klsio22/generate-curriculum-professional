import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // @react-pdf/renderer is a heavy dependency and can legitimately exceed 500 kB.
    // Keep it isolated and relax the warning threshold to reduce noisy build output.
    chunkSizeWarningLimit: 1700,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-hook-form', 'react-i18next', 'i18next'],
          pdf: ['@react-pdf/renderer', 'react-to-print'],
          ui: ['lucide-react'],
        },
      },
    },
  },
});
