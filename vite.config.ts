import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // <-- Add this import

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      services: path.resolve(__dirname, 'src/services'),
      // If you want to use more aliases, add them here
      // e.g. components: path.resolve(__dirname, 'src/components'),
    },
  },
});
