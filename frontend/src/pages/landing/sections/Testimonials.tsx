// ──────────────────────────────────────────────
// Testimonials — tres columnas en movimiento.
// La del centro baja mientras las de los lados
// suben: el contraste da sensación de que hay
// muchas más opiniones de las que caben.
//
// Cada columna repite su lista dos veces y recorre
// exactamente la mitad de su altura, así que al
// reiniciar el ciclo no se ve ningún salto.
//
// ⚠️ El texto es inventado — ver features/testimonials/data.ts
// ──────────────────────────────────────────────

import { useMemo, type CSSProperties } from 'react'
import { Quote } from 'lucide-react'
import {
  TESTIMONIALS,
  splitIntoColumns,
  type Testimonial,
} from '@features/testimonials/data'
import { useTranslatedContent } from '@services/translate'
import { Section, SectionHead } from './shared'

// Sentido y ritmo de cada columna. Duraciones distintas
// para que no queden sincronizadas y se note el bucle.
const MOTION = [
  { direction: 'marquee-up', duration: '46s' },
  { direction: 'marquee-down', duration: '38s' },
  { direction: 'marquee-up', duration: '52s' },
]

function Card({ item }: { item: Testimonial }) {
  const isNeutral = item.tone === 'neutral'

  return (
    <figure className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5">
      <Quote
        className={`mb-3 h-4 w-4 ${
          isNeutral ? 'text-[var(--text-muted)]' : 'text-[var(--poker-gold)]'
        }`}
        aria-hidden="true"
      />

      <blockquote className="text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
        {item.text}
      </blockquote>

      <figcaption className="mt-4 flex items-center gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-caption font-bold ${
            isNeutral
              ? 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
              : 'bg-[var(--poker-gold)]/15 text-[var(--poker-gold)]'
          }`}
          aria-hidden="true"
        >
          {item.initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[0.8125rem] font-semibold text-[var(--text-primary)]">
            {item.name}
          </span>
          <span className="block truncate text-caption text-[var(--text-muted)]">
            {item.role}
          </span>
        </span>
      </figcaption>
    </figure>
  )
}

function Column({ items, index }: { items: Testimonial[]; index: number }) {
  const { direction, duration } = MOTION[index]

  return (
    <div
      className={`${direction} flex flex-col gap-4`}
      style={{ '--marquee-duration': duration } as CSSProperties}
    >
      {/* La lista va dos veces: la segunda copia es la que
          hace que el bucle no tenga costura. */}
      {[...items, ...items].map((item, i) => (
        <Card key={`${item.name}-${i}`} item={item} />
      ))}
    </div>
  )
}

export default function Testimonials() {
  const testimonials = useTranslatedContent(TESTIMONIALS)
  const columns = useMemo(() => splitIntoColumns(testimonials, 3), [testimonials])
  return (
    <Section id="opiniones">
      <SectionHead
        centered
        eyebrow="Opiniones"
        title="Lo que cuentan quienes ya están dentro"
        subtitle="Estudiantes de los cuatro niveles, con lo bueno y lo mejorable."
      />

      <div
        className="marquee-stage relative grid h-[34rem] grid-cols-1 gap-4 overflow-hidden sm:grid-cols-2 lg:h-[38rem] lg:grid-cols-3"
        aria-label="Opiniones de estudiantes"
      >
        {columns.map((items, index) => (
          <div
            key={index}
            // La tercera columna solo aparece cuando hay sitio de sobra.
            className={index === 2 ? 'hidden lg:block' : ''}
          >
            <Column items={items} index={index} />
          </div>
        ))}
      </div>
    </Section>
  )
}
