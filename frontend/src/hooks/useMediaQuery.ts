// ──────────────────────────────────────────────
// useMediaQuery — ¿cumple la pantalla la consulta?
// Se actualiza al girar el móvil o redimensionar.
// Sin matchMedia (tests, SSR) devuelve false.
// ──────────────────────────────────────────────

import { useCallback, useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      return () => list.removeEventListener('change', notify)
    },
    [query],
  )

  const snapshot = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false

  return useSyncExternalStore(subscribe, snapshot, () => false)
}
