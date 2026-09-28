import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url))
const srcDir = resolve(rootDir, 'src')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@poker/engine': resolve(rootDir, '../packages/poker-engine/src'),
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
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/test/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/test/**',
        'src/main.tsx',
        'src/**/*.d.ts',
      ],
    },
  },
})
