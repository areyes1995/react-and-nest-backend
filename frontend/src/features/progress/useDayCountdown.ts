// ──────────────────────────────────────────────
// useDayCountdown — cuánto queda del día (local).
// Los retos, el cofre y la racha se reinician a
// medianoche: ver el reloj correr es la pizca de
// urgencia que empuja a hacerlo hoy y no mañana.
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react'

export function msUntilMidnight(now: Date = new Date()): number {
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime() - now.getTime()
}

/** "5 h 12 min", "42 min", "58 s". */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h} h ${m} min`
  if (m > 0) return `${m} min ${String(s).padStart(2, '0')} s`
  return `${s} s`
}

/** Milisegundos hasta medianoche, actualizados cada segundo. */
export function useDayCountdown(): number {
  const [ms, setMs] = useState(() => msUntilMidnight())
  useEffect(() => {
    const id = window.setInterval(() => setMs(msUntilMidnight()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return ms
}
