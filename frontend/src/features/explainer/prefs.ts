// ──────────────────────────────────────────────
// Preferencias del modo explicativo, compartidas.
//
// El panel principal y las mesas que aparecen dentro
// de la clase leen las mismas: apagar la voz en una
// la apaga en las demás.
//
// `enabled` = "Mesas con audio": las mesas dentro de
// la clase y el relevo del audio. Va activado por
// defecto. Que el panel principal esté desplegado o
// minimizado no es una preferencia: cada clase empieza
// con él minimizado.
// Se recuerdan entre clases (localStorage) y, si el
// navegador no deja guardar, viven en memoria.
// ──────────────────────────────────────────────

import { useCallback, useSyncExternalStore } from 'react'

export type ExplainerPref = 'enabled' | 'follow' | 'voice'

const STORAGE: Record<ExplainerPref, string> = {
  // Clave nueva a propósito: la antigua (`explainer-open`) guardaba "panel
  // abierto", que por defecto era no; esta es "mesas activadas", por defecto sí.
  enabled: 'explainer-enabled',
  follow: 'explainer-follow',
  voice: 'explainer-voice',
}

const DEFAULTS: Record<ExplainerPref, boolean> = { enabled: true, follow: true, voice: true }

function read(key: ExplainerPref): boolean {
  try {
    const value = localStorage.getItem(STORAGE[key])
    return value === null ? DEFAULTS[key] : value === '1'
  } catch {
    return DEFAULTS[key]
  }
}

let values: Record<ExplainerPref, boolean> | null = null
const listeners = new Set<() => void>()

function current(): Record<ExplainerPref, boolean> {
  values ??= { enabled: read('enabled'), follow: read('follow'), voice: read('voice') }
  return values
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setExplainerPref(key: ExplainerPref, value: boolean) {
  values = { ...current(), [key]: value }
  try {
    localStorage.setItem(STORAGE[key], value ? '1' : '0')
  } catch {
    /* solo en memoria */
  }
  listeners.forEach(listener => listener())
}

export function useExplainerPref(key: ExplainerPref): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(subscribe, () => current()[key], () => DEFAULTS[key])
  const set = useCallback((next: boolean) => setExplainerPref(key, next), [key])
  return [value, set]
}
