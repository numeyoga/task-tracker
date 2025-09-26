import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte({
    compilerOptions: {
      // Enable runtime optimizations
      dev: process.env.NODE_ENV !== 'production'
    }
  })],

  base: process.env.NODE_ENV === 'production' ? '/task-tracker/' : '/',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',

    // Optimize bundle size and loading
    target: 'esnext',
    cssMinify: true,
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB

    rollupOptions: {
      output: {
        // Enhanced manual chunking for better caching
        manualChunks: (id) => {
          // Vendor dependencies
          if (id.includes('node_modules')) {
            // Split large dependencies
            if (id.includes('svelte')) {
              return 'svelte';
            }
            return 'vendor';
          }

          // App chunks based on functionality
          if (id.includes('components/Timer/')) {
            return 'timer';
          }
          if (id.includes('components/Tasks/')) {
            return 'tasks';
          }
          if (id.includes('components/Reports/')) {
            return 'reports';
          }
          if (id.includes('services/')) {
            return 'services';
          }
          if (id.includes('stores/')) {
            return 'stores';
          }
          if (id.includes('models/')) {
            return 'models';
          }
        },

        // Optimize file naming for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      },

      // External dependencies (none for this offline app)
      external: []
    },

    // Terser options for better compression
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      }
    },

    // CSS code splitting
    cssCodeSplit: true
  },

  // Development optimizations
  server: {
    fs: {
      strict: true
    }
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['svelte'],
    exclude: []
  },

});
