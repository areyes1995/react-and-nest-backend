// ──────────────────────────────────────────────
// BrandMark — la marca de la academia.
// El cuadrado dorado con la pica, dibujado en CSS
// para que escale sin pixelarse y tome el oro del
// tema. Es la misma marca que lleva la barra lateral
// del dashboard; vive aquí para que las pantallas de
// acceso no vuelvan a desincronizarse de la app.
// ──────────────────────────────────────────────

import { Spade } from 'lucide-react'

interface BrandMarkProps {
  /** Lado del cuadrado, en píxeles. */
  size?: number
  className?: string
}

export default function BrandMark({ size = 32, className = '' }: BrandMarkProps) {
  return (
    <span
      className={`grid shrink-0 place-items-center ${className}`}
      style={{
        width: size,
        height: size,
        // 25% es el rounded-lg del dashboard a su tamaño (8px sobre 32),
        // expresado en proporción para que aguante cualquier escala.
        borderRadius: '25%',
        background: 'var(--poker-gold)',
      }}
    >
      <Spade
        className="text-black"
        style={{ width: size * 0.5, height: size * 0.5 }}
        fill="currentColor"
        strokeWidth={0}
      />
    </span>
  )
}
