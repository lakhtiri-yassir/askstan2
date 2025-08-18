import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: false
    }
  },
  build: {
    target: 'es2015',
    cssCodeSplit: true,
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    terserOptions: undefined,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          auth: ['@supabase/supabase-js'],
          payments: ['@stripe/stripe-js']
        }
      }
    }
  },
  define: {
    'process.env': {}
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});