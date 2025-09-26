import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({
    compilerOptions: {
      dev: true,
      hydratable: true
    },
    onwarn: (warning, handler) => {
      // Ignore lifecycle function warnings in tests
      if (warning.code === 'lifecycle_function_unavailable') return;
      handler(warning);
    }
  })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    alias: {
      'svelte/internal/server': 'svelte/internal/client'
    },
    css: true,
    // Fix TextEncoder issue
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    // Mock browser APIs
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously'
      }
    },
    // Include dependencies that need to be transformed
    deps: {
      optimizer: {
        web: {
          include: ['svelte']
        }
      }
    },
    // Exclude problematic dependencies
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '**/*.config.js'
    ]
  }
});