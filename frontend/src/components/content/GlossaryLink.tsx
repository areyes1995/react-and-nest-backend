// ──────────────────────────────────────────────
// GlossaryLink — un término del glosario dentro de
// una clase. Al pulsarlo abre una ficha con su
// definición sin sacar al alumno de la lección, y
// desde ella se puede ir al glosario completo con
// el término ya señalado.
// ──────────────────────────────────────────────

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { BookA, ArrowRight, X } from 'lucide-react'
import { categoryMeta, type GlossaryTerm } from '@features/glossary/data'
import { useTranslatedContent } from '@services/translate'

/** Ancho de la ficha; se recorta en pantallas estrechas. */
const CARD_WIDTH = 288
const GUTTER = 12

/** Ruta del glosario con el término señalado. */
export function glossaryPath(term: string): string {
  return `/app/glossary?term=${encodeURIComponent(term)}`
}

interface Position {
  top: number
  left: number
  /** Si no cabe debajo de la palabra, se abre encima. */
  above: boolean
}

interface TermCardProps {
  id: string
  term: GlossaryTerm
  anchor: HTMLElement
  onClose: () => void
}

function TermCard({ id, term, anchor, onClose }: TermCardProps) {
  const navigate = useNavigate()
  const card = useRef<HTMLDivElement>(null)
  const translated = useTranslatedContent(term)
  const meta = useTranslatedContent(categoryMeta(term.category))
  const [position, setPosition] = useState<Position | null>(null)

  // Se coloca pegada a la palabra, sin salirse de la ventana.
  useLayoutEffect(() => {
    const place = () => {
      const rect = anchor.getBoundingClientRect()
      const width = Math.min(CARD_WIDTH, window.innerWidth - GUTTER * 2)
      const height = card.current?.offsetHeight ?? 0
      const left = Math.min(Math.max(GUTTER, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - GUTTER)
      const above = rect.bottom + height + GUTTER > window.innerHeight && rect.top - height - GUTTER > 0
      setPosition({ left, top: above ? rect.top - height - 6 : rect.bottom + 6, above })
    }
    place()
    window.addEventListener('resize', place)
    // `true`: también el scroll de los contenedores internos de la clase.
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchor])

  // Se cierra con Escape o pulsando fuera (pero no sobre la propia palabra,
  // que ya se encarga de alternarla).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        anchor.focus()
      }
    }
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (card.current?.contains(target) || anchor.contains(target)) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [anchor, onClose])

  return createPortal(
    <div
      ref={card}
      id={id}
      role="dialog"
      aria-label={`Glosario: ${term.term}`}
      className="fixed z-[70] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-2xl"
      style={{
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        width: `min(${CARD_WIDTH}px, calc(100vw - ${GUTTER * 2}px))`,
        visibility: position ? 'visible' : 'hidden',
      }}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: meta.color }} aria-hidden />

      <div className="space-y-2 p-3.5 pl-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]" translate="no">
              {term.term}
            </p>
            {translated.spanish && (
              <p className="text-xs italic text-[var(--text-muted)]">{translated.spanish}</p>
            )}
          </div>
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-mini font-semibold uppercase tracking-wide"
            style={{ background: `${meta.color}1f`, color: meta.color }}
          >
            {meta.label}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 -mt-0.5 shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{translated.definition}</p>

        <button
          type="button"
          onClick={() => navigate(glossaryPath(term.term))}
          className="flex w-full items-center gap-1.5 rounded-lg bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--poker-gold)] transition hover:bg-[var(--bg-surface-hover)]"
        >
          <BookA className="h-3.5 w-3.5" strokeWidth={1.75} />
          Ver en el glosario
          <ArrowRight className="ml-auto h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>,
    document.body,
  )
}

export default function GlossaryLink({ term, children }: { term: GlossaryTerm; children: string }) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)
  const id = useId()

  return (
    <>
      <button
        ref={anchor}
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        data-glossary-term={term.term}
        className="inline cursor-help rounded-sm p-0 font-[inherit] text-inherit underline decoration-[var(--poker-gold)]/60 decoration-dotted decoration-2 underline-offset-4 transition-colors hover:text-[var(--poker-gold)] hover:decoration-[var(--poker-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--poker-gold)]"
      >
        {children}
      </button>
      {open && anchor.current && (
        <TermCard id={id} term={term} anchor={anchor.current} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
