import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'

// Serve local-config JSON files as static assets
function serveLocalConfig() {
  return {
    name: 'serve-local-config',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/local-config', async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url
        if (!url || !url.endsWith('.json')) return next()

        if (req.method === 'POST') {
          let data = ''
          for await (const chunk of req) { data += chunk }
          const filePath = join(process.cwd(), 'local-config', url)
          try {
            const parsed = JSON.parse(data)
            writeFileSync(filePath, JSON.stringify(parsed, null, 2))
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid JSON', detail: err }))
          }
          return
        }

        try {
          const filePath = join(process.cwd(), 'local-config', url)
          if (statSync(filePath).isFile()) {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(readFileSync(filePath))
            return
          }
        } catch {
          // pass through
        }
        next()
      })
    },
  }
}

const rootDir = dirname(fileURLToPath(import.meta.url))

// El motor de poker vive en packages/poker-engine y se consume como fuente TS.
// El alias evita depender de que pnpm haya enlazado el workspace.
const pokerEngine = resolve(rootDir, '../packages/poker-engine/src')
const srcDir = resolve(rootDir, 'src')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveLocalConfig()],
  resolve: {
    alias: {
      '@poker/engine': pokerEngine,
      '@components': join(srcDir, 'components'),
      '@features': join(srcDir, 'features'),
      '@pages': join(srcDir, 'pages'),
      '@services': join(srcDir, 'services'),
      '@context': join(srcDir, 'context'),
      '@hooks': join(srcDir, 'hooks'),
      '@utils': join(srcDir, 'utils'),
      '@routes': join(srcDir, 'routes'),
      '@records': join(srcDir, 'records'),
      '@i18n': join(srcDir, 'i18n'),
      '@': srcDir,
    },
  },
  server: {
    host: true,
    port: 5173,
    fs: {
      // Permite servir el paquete del motor, que vive fuera de frontend/.
      allow: [rootDir, resolve(rootDir, '../packages')],
    },
    strictPort: true,
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: true,
    },
    proxy: {
      // Solo para llamadas relativas a /api desde el navegador en dev.
      // El backend local escucha en 3000; en Docker se mapea a 4000.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})