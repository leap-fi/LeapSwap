import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    target: 'esnext',
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
      process: 'process/browser',
    },
    // Resolve @leapswap/* from node_modules (npm registry), not monorepo packages/
    dedupe: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      '@leapswap/widget',
      '@leapswap/widget-sdk',
      '@leapswap/wallet-management',
      '@leapswap/widget-types',
    ],
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    port: 3001,
    open: true,
    // Browser demos hit CORS on Kyber hosts; proxy keeps official URLs server-side.
    proxy: {
      '/kyber-setting': {
        target: 'https://ks-setting.kyberswap.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/kyber-setting/, ''),
      },
      '/kyber-aggregator': {
        target: 'https://aggregator-api.kyberswap.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/kyber-aggregator/, ''),
      },
      '/llama-prices': {
        target: 'https://coins.llama.fi',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/llama-prices/, ''),
      },
    },
  },
})
