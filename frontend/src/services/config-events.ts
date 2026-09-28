const listeners: Set<() => void> = new Set()

export function onConfigUpdate(callback: () => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function emitConfigUpdate(): void {
  listeners.forEach(cb => cb())
}
