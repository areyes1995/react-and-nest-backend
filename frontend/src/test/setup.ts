import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Limpia el DOM entre pruebas
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
})
