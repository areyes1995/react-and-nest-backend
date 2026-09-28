// ──────────────────────────────────────────────
// shared — las piezas que repiten todas las
// secciones de la portada: la marca, el contenedor
// con su ritmo vertical y el encabezado de sección.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import { Spade } from 'lucide-react'

/** Marca de la plataforma, dibujada — sin depender de un archivo externo. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-lg"
      style={{ width: size, height: size, background: 'var(--poker-gold)' }}
    >
      <Spade
        className="text-black"
        style={{ width: size * 0.55, height: size * 0.55 }}
        fill="currentColor"
        strokeWidth={0}
      />
    </span>
  )
}

interface SectionProps {
  id?: string
  children: ReactNode
  className?: string
}

/** Contenedor de sección: ancho máximo, aire vertical y revelado al entrar. */
export function Section({ id, children, className = '' }: SectionProps) {
  return (
    // scroll-mt deja hueco para la barra fija al saltar por ancla.
    <section id={id} className={`px-5 py-20 sm:px-8 md:py-28 ${id ? 'scroll-mt-16' : ''} ${className}`}>
      <div className="landing-reveal mx-auto w-full max-w-6xl">{children}</div>
    </section>
  )
}

interface SectionHeadProps {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  /** Centra el bloque. Por defecto va alineado a la izquierda. */
  centered?: boolean
}

export function SectionHead({ eyebrow, title, subtitle, centered = false }: SectionHeadProps) {
  return (
    <header className={`mb-12 ${centered ? 'mx-auto max-w-2xl text-center' : 'max-w-3xl'}`}>
      {eyebrow && (
        <span className="mb-3 inline-block text-caption font-bold uppercase tracking-[0.18em] text-[var(--poker-gold)]">
          {eyebrow}
        </span>
      )}
      <h2 className="text-[clamp(1.75rem,3.4vw,2.6rem)] font-extrabold leading-[1.12] tracking-tight text-[var(--text-primary)]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-[var(--text-secondary)]">
          {subtitle}
        </p>
      )}
    </header>
  )
}
