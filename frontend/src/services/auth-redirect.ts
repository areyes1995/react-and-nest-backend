// ──────────────────────────────────────────────
// Redirección post-login: recuerda a qué ruta
// protegida intentaba entrar el usuario para volver tras iniciar sesión.
// ──────────────────────────────────────────────

const KEY = 'auth:redirect'

/** Solo rutas internas (evita open redirects tipo `//evil.com`). */
function isSafePath(path: string | null): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/login')
}

export function rememberRedirect(path: string): void {
  if (!isSafePath(path)) return
  try {
    sessionStorage.setItem(KEY, path)
  } catch {
    // almacenamiento no disponible
  }
}

export function readRedirect(fallback = '/app'): string {
  try {
    const path = sessionStorage.getItem(KEY)
    return isSafePath(path) ? path : fallback
  } catch {
    return fallback
  }
}

export function clearRedirect(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // almacenamiento no disponible
  }
}
