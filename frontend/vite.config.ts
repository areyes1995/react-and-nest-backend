import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url))
const srcDir = resolve(rootDir, 'src')

export const aliases = {
  '@components': join(srcDir, 'components'),
  '@pages': join(srcDir, 'pages'),
  '@services': join(srcDir, 'services'),
  '@context': join(srcDir, 'context'),
  '@hooks': join(srcDir, 'hooks'),
  '@lib': join(srcDir, 'lib'),
  '@': srcDir,
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { alias: aliases },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: { usePolling: true },
    proxy: {
      // Llamadas relativas a /api en desarrollo (VITE_API_URL=/api/v1).
      '/api': { target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000', changeOrigin: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
})
