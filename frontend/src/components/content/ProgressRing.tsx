// ──────────────────────────────────────────────
// ProgressRing — anillo de progreso.
// Un círculo lee mejor que una barra cuando va
// pegado a un icono, y es lo que usan las rutas de
// aprendizaje para marcar cada nodo.
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { prefersReducedMotion } from './AnimatedNumber'

/**
 * Valor que arranca en 0 y, un fotograma después, pasa al real: así la barra o
 * el anillo se llenan al aparecer (la transición CSS hace el resto).
 */
function useFillOnMount(value: number): number {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0))
  useEffect(() => {
    if (typeof requestAnimationFrame !== 'function') {
      setShown(value)
      return
    }
    const frame = requestAnimationFrame(() => setShown(value))
    return () => cancelAnimationFrame(frame)
  }, [value])
  return shown
}

export interface ProgressRingProps {
  /** Progreso 0..1. */
  value: number
  size?: number
  stroke?: number
  /** Color del arco; por defecto el dorado de la marca. */
  color?: string
  children?: ReactNode
  className?: string
}

export default function ProgressRing({
  value,
  size = 48,
  stroke = 4,
  color = 'var(--poker-gold)',
  children,
  className = '',
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, useFillOnMount(value)))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className={`relative inline-grid place-items-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-surface)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">{children}</span>
    </div>
  )
}

export interface ProgressBarProps {
  value: number
  color?: string
  className?: string
}

/** Barra de progreso fina — para cursos y niveles en listados. */
export function ProgressBar({ value, color = 'var(--poker-gold)', className = '' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, useFillOnMount(value)))
  return (
    <div className={`h-1.5 rounded-full bg-[var(--bg-surface)] overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${clamped * 100}%`, background: color }}
      />
    </div>
  )
}
