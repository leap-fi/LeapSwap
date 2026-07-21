import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const workspaceAliases = {
  '@leapswap/widget': path.join(root, 'packages/widget/src'),
  '@leapswap/widget-sdk': path.join(root, 'packages/widget-sdk/src'),
  '@leapswap/wallet-management': path.join(
    root,
    'packages/wallet-management/src'
  ),
  '@leapswap/widget-types': path.join(root, 'packages/widget-types/src'),
}

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
      ...workspaceAliases,
      buffer: 'buffer/',
      process: 'process/browser',
    },
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
    exclude: Object.keys(workspaceAliases),
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    port: 3001,
    open: true,
    fs: {
      allow: [root],
    },
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
