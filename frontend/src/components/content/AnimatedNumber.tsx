// ──────────────────────────────────────────────
// AnimatedNumber — un número que cuenta hasta su
// valor en vez de aparecer de golpe. Ver subir el XP
// o las clases completadas es parte de la recompensa.
//
// Cuenta desde el valor anterior (o desde 0 la
// primera vez) con ease-out; con "reducir
// movimiento" muestra el valor directamente.
// ──────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

export function useAnimatedNumber(value: number, duration = 700): number {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0))
  const from = useRef(shown)

  useEffect(() => {
    if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
      setShown(value)
      from.current = value
      return
    }
    const start = performance.now()
    const initial = from.current
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = Math.round(initial + (value - initial) * eased)
      setShown(current)
      from.current = current
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return shown
}

export interface AnimatedNumberProps {
  value: number
  duration?: number
  /** Formato final (separador de miles, sufijos…). */
  format?: (n: number) => string
  className?: string
}

export default function AnimatedNumber({ value, duration, format, className }: AnimatedNumberProps) {
  const shown = useAnimatedNumber(value, duration)
  return (
    <span className={`tabular-nums ${className ?? ''}`} aria-label={format ? format(value) : String(value)}>
      {format ? format(shown) : shown}
    </span>
  )
}
