import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// Dev: resolve workspace packages to source (no prebuild). Publish still needs build.
const workspaceAliases = {
  '@leapswap/business-integrator': path.join(
    root,
    'packages/business-integrator/src'
  ),
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
      // Near / util 等 Node 包在浏览器里需要 process
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
    port: 3000,
    open: true,
    fs: {
      allow: [root],
    },
  },
})
