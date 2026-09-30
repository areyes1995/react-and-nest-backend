import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { aliases } from './vite.config.ts'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: aliases },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/test/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/test/**', 'src/main.tsx', 'src/**/*.d.ts'],
    },
  },
})
