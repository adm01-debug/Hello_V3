import type { UserConfig } from 'vite';

const config: UserConfig = {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'vendor-utils': ['date-fns', 'lodash-es'],
          'vendor-query': ['@tanstack/react-query'],
          
          // Feature chunks
          'feature-dashboard': [
            './src/pages/Dashboard.tsx',
            './src/components/Dashboard',
          ],
          'feature-calls': [
            './src/pages/Calls.tsx',
            './src/components/Calls',
          ],
          'feature-contacts': [
            './src/pages/Contacts.tsx',
            './src/components/Contacts',
          ],
        },
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
};

export default config;
