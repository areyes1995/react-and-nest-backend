// ──────────────────────────────────────────────
// ContentBlocks — el renderizador de las clases.
// Cada clase es una lista de bloques tipados, así
// que el texto puede intercalar manos reales,
// tablas, tests y ejercicios en la mesa sin salirse
// del sistema de diseño.
// ──────────────────────────────────────────────

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, Lightbulb, Key, TriangleAlert, Spade, ArrowRight, Volume2, Pause } from 'lucide-react'
import { parseCards } from '@poker/engine'
import { CardRow } from '@components/poker'
import { tableRowForChunk } from '@features/speech/lessonScript'
import { tableFocusForText, type TableFocus } from '@features/explainer/tableRows'
import type { ContentBlock, QuizQuestion } from '@features/academy/types'
import { linkGlossaryTerms } from '@features/glossary/linker'
import GlossaryLink from './GlossaryLink'
import ShowcaseTabs from '@components/explainer/ShowcaseTabs'
import RangeBlock from './RangeBlock'

/** URLs que el texto puede traer (p. ej. la web de un solver). */
const URL_RE = /(https?:\/\/[^\s<>"')]+)/g

/** Quita la puntuación final que no es parte del enlace ("ver https://a.com."). */
function cleanUrl(url: string): { url: string; suffix: string } {
  const tail = url.match(/[.,;:!?)]+$/)
  if (!tail) return { url, suffix: '' }
  return { url: url.slice(0, -tail[0].length), suffix: tail[0] }
}

/** Un enlace externo: pestaña nueva y sin traducir (la URL no se traduce). */
function ExternalLink({ url }: { url: string }) {
  const { url: clean, suffix } = cleanUrl(url)
  return (
    <>
      <a
        href={clean}
        target="_blank"
        rel="noreferrer noopener"
        translate="no"
        className="font-medium text-[var(--poker-gold)] underline decoration-[var(--poker-gold)]/40 underline-offset-2 hover:decoration-[var(--poker-gold)] break-all"
      >
        {clean}
      </a>
      {suffix}
    </>
  )
}

/** Texto plano con los términos del glosario convertidos en enlaces. */
function withGlossary(text: string, seen: Set<string> | null): ReactNode {
  if (!seen) return text
  return linkGlossaryTerms(text, seen).map((segment, index) =>
    typeof segment === 'string' ? (
      segment
    ) : (
      <GlossaryLink key={index} term={segment.term}>
        {segment.text}
      </GlossaryLink>
    ),
  )
}

/**
 * Convierte `**negrita**` en <strong>, las URLs en enlaces y la primera
 * aparición de cada término del glosario en una ficha consultable.
 * Es una función y no un componente: `seen` se comparte entre todos los
 * textos de la clase y tiene que recorrerse en orden, en el mismo render.
 */
function richText(text: string, seen: Set<string> | null): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index} className="font-semibold text-[var(--text-primary)]">
        {withGlossary(part.slice(2, -2), seen)}
      </strong>
    ) : (
      <span key={index}>
        {part.split(URL_RE).map((chunk, chunkIndex) =>
          /^https?:\/\//.test(chunk) ? (
            <ExternalLink key={chunkIndex} url={chunk} />
          ) : (
            <span key={chunkIndex}>{withGlossary(chunk, seen)}</span>
          ),
        )}
      </span>
    ),
  )
}

/** Audio de la clase por bloque: escuchar desde cualquier texto o tabla. */
export interface BlockAudio {
  /** El bloque tiene algo que leer (los tests y los ejercicios no). */
  canPlay: (index: number) => boolean
  /** El audio de la clase está sonando. */
  playing: boolean
  onPlay: (index: number) => void
  onPause: () => void
}

/**
 * Botón "escuchar desde aquí" al final de un bloque.
 * Con ratón aparece al pasar por encima del bloque (y con el teclado al
 * enfocarlo). En pantallas táctiles no hay hover: se ve siempre, discreto,
 * con una zona táctil más grande que el icono.
 */
function ListenFromHere({ active, playing, onClick }: { active: boolean; playing: boolean; onClick: () => void }) {
  const pausing = active && playing
  const Icon = pausing ? Pause : Volume2
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={pausing ? 'Pausar el audio' : 'Escuchar desde aquí'}
      title={pausing ? 'Pausar el audio' : 'Escuchar desde aquí'}
      data-listen-from-here
      className={`ml-1.5 inline-grid h-6 w-6 shrink-0 place-items-center rounded-full align-middle transition-all duration-150 [@media(pointer:coarse)]:ml-1 [@media(pointer:coarse)]:h-8 [@media(pointer:coarse)]:w-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--poker-gold)] ${
        active
          ? 'bg-[var(--poker-gold)]/15 text-[var(--poker-gold)] opacity-100'
          : 'text-[var(--text-muted)] opacity-60 hover:bg-[var(--bg-surface)] hover:text-[var(--poker-gold)] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/block:opacity-100 focus-visible:opacity-100'
      }`}
    >
      <Icon className={`h-3.5 w-3.5${pausing ? '' : ' -translate-y-px'}`} strokeWidth={2} />
    </button>
  )
}

const CALLOUT_STYLE = {
  key: { icon: Key, className: 'border-[var(--poker-gold)]/35 bg-[var(--poker-gold)]/[0.07]', color: 'text-[var(--poker-gold)]' },
  tip: { icon: Lightbulb, className: 'border-sky-500/30 bg-sky-500/[0.07]', color: 'text-sky-400' },
  warning: { icon: TriangleAlert, className: 'border-amber-500/30 bg-amber-500/[0.07]', color: 'text-amber-400' },
} as const

/** Convierte "As Kh" en cartas, ignorando notaciones inválidas. */
function safeCards(text: string) {
  try {
    return parseCards(text)
  } catch {
    return []
  }
}

export interface QuizBlockProps {
  questions: QuizQuestion[]
  onComplete?: (result: { correct: number; total: number }) => void
}

function QuizBlock({ questions, onComplete }: QuizBlockProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const answer = (question: QuizQuestion, index: number) => {
    if (answers[question.id] !== undefined) return
    const next = { ...answers, [question.id]: index }
    setAnswers(next)

    if (Object.keys(next).length === questions.length) {
      const correct = questions.filter(q => next[q.id] === q.answerIndex).length
      onComplete?.({ correct, total: questions.length })
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Comprueba lo que has entendido
      </h4>

      {questions.map(question => {
        const given = answers[question.id]
        const answered = given !== undefined

        return (
          <div key={question.id} className="space-y-2">
            <p className="text-sm font-medium text-[var(--text-primary)]">{question.question}</p>

            <div className="grid gap-1.5">
              {question.options.map((option, index) => {
                const isCorrect = index === question.answerIndex
                const isChosen = given === index

                let tone = 'border-[var(--border)] hover:border-[var(--border-active)] hover:bg-[var(--bg-surface-soft)]'
                if (answered && isCorrect) tone = 'border-emerald-500/50 bg-emerald-500/10'
                else if (answered && isChosen) tone = 'border-red-500/50 bg-red-500/10'
                else if (answered) tone = 'border-[var(--border)] opacity-50'
            // Respuesta inmediata: rebote con brillo si aciertas, sacudida si fallas.
            if (answered && isChosen) tone += isCorrect ? ' animate-answer-correct' : ' animate-answer-wrong'

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={answered}
                    onClick={() => answer(question, index)}
                    className={`flex items-center gap-2 text-left px-3 py-2 rounded-lg border text-sm text-[var(--text-secondary)] transition-all duration-150 ${tone}`}
                  >
                    {answered && isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2.5} />}
                    {answered && isChosen && !isCorrect && <X className="w-4 h-4 text-red-400 shrink-0" strokeWidth={2.5} />}
                    <span>{option}</span>
                  </button>
                )
              })}
            </div>

            {answered && (
              <p className="text-xs text-[var(--text-muted)] leading-relaxed pl-1 border-l-2 border-[var(--border-active)] ml-1 pl-3">
                {question.explanation}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export interface ContentBlocksProps {
  blocks: ContentBlock[]
  /** Resultado del test de la clase, si lo tiene. */
  onQuizComplete?: (result: { correct: number; total: number }) => void
  /** Ruta de la práctica guiada, cuando los bloques son de una clase concreta. */
  practicePath?: string
  /** Bloque que se está leyendo en voz alta: se resalta. */
  activeIndex?: number | null
  /**
   * Trozo (frase) del audio dentro del bloque activo: marca con un borde la
   * fila de la tabla que se está explicando.
   */
  activeChunk?: number | null
  /** Contenido extra bajo un bloque (p. ej. la mesa del modo explicativo). */
  renderAfter?: (index: number) => ReactNode
  /**
   * Frase que está explicando una mesa con audio y los bloques (de `from` a
   * `to`, sin incluir) que están con ella en el mismo paso: sus tablas marcan
   * la fila o la columna de lo que se está diciendo.
   */
  sceneCaption?: { text: string; from: number; to: number } | null
  /** Botón para escuchar la clase desde cada bloque. Sin él no se muestra. */
  blockAudio?: BlockAudio
  /** Enlaza los términos del glosario (la primera vez que aparece cada uno). */
  glossary?: boolean
}

export default function ContentBlocks({
  blocks,
  onQuizComplete,
  practicePath,
  activeIndex,
  activeChunk,
  renderAfter,
  sceneCaption,
  blockAudio,
  glossary = true,
}: ContentBlocksProps) {
  const body = useRef<HTMLDivElement>(null)
  // Términos ya enlazados en este render: cada uno solo se marca una vez.
  const seen = glossary ? new Set<string>() : null

  // La fila que suena se mantiene a la vista dentro de tablas largas.
  useEffect(() => {
    if (activeIndex === null || activeIndex === undefined) return
    body.current
      ?.querySelector('[data-table-row-active="true"]')
      // `?.()`: jsdom no lo implementa y en el navegador puede no existir.
      ?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [activeIndex, activeChunk])

  const renderBlock = (block: ContentBlock, index: number, activeRow: number | null, sceneFocus: TableFocus | null) => {
    const listen =
      blockAudio && blockAudio.canPlay(index) ? (
        <ListenFromHere
          active={activeIndex === index}
          playing={blockAudio.playing}
          onClick={() =>
            activeIndex === index && blockAudio.playing ? blockAudio.onPause() : blockAudio.onPlay(index)
          }
        />
      ) : null
    // Tablas, manos y ejercicios no acaban en una línea de texto: el botón va debajo, a la derecha.
    const listenBelow = listen && <div className="mt-1.5 flex justify-end">{listen}</div>

    switch (block.type) {
      case 'heading':
        return (
          <h3 key={index} className="text-lg font-bold text-[var(--text-primary)] pt-2">
            {block.text}
            {listen}
          </h3>
        )

      case 'paragraph':
        return (
          <p key={index} className="text-[0.9375rem] sm:text-base leading-7 text-[var(--text-secondary)]">
            {richText(block.text, seen)}
            {listen}
          </p>
        )

      case 'list': {
        const Tag = block.ordered ? 'ol' : 'ul'
        return (
          <Tag
            key={index}
            className={`space-y-2 text-[0.9375rem] sm:text-base leading-7 text-[var(--text-secondary)] pl-5 ${
              block.ordered ? 'list-decimal' : 'list-disc'
            } marker:text-[var(--poker-gold)]`}
          >
            {block.items.map((item, i) => (
              <li key={i} className="leading-relaxed pl-1">
                {richText(item, seen)}
                {i === block.items.length - 1 && listen}
              </li>
            ))}
          </Tag>
        )
      }

      case 'callout': {
        const style = CALLOUT_STYLE[block.tone]
        const CalloutIcon = style.icon
        return (
          <div key={index} className={`rounded-xl border p-3.5 ${style.className}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <CalloutIcon className={`w-4 h-4 ${style.color}`} strokeWidth={2} />
              <span className={`text-xs font-semibold ${style.color}`}>{block.title}</span>
            </div>
            <p className="text-[0.9375rem] leading-7 text-[var(--text-secondary)]">
              {richText(block.text, seen)}
              {listen}
            </p>
          </div>
        )
      }

      case 'table':
        return (
          <div key={index}>
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm border-collapse min-w-[27.5rem]">
                <thead>
                  <tr className="bg-[var(--bg-surface-soft)]">
                    {block.headers.map((header, i) => (
                      <th
                        key={i}
                        className={`text-left px-3 py-2 text-caption font-semibold uppercase tracking-wide text-[var(--text-muted)]${
                          i === sceneFocus?.column ? ' table-scene-col-active' : ''
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, i) => (
                    <tr
                      key={i}
                      data-table-row-active={i === activeRow || undefined}
                      data-table-scene-row={i === sceneFocus?.row || undefined}
                      className={`border-t border-[var(--border)]${i === activeRow ? ' table-speech-row-active' : ''}${
                        i === sceneFocus?.row ? ' table-scene-row-active' : ''
                      }`}
                    >
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`px-3 py-2 align-top ${
                            j === 0 ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'
                          }${j === sceneFocus?.column ? ' table-scene-col-active' : ''}`}
                        >
                          {richText(cell, seen)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {listenBelow}
          </div>
        )

      case 'hands':
        return (
          <div key={index}>
            <div className="grid gap-2 sm:grid-cols-2">
              {block.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-3"
                >
                  <CardRow cards={safeCards(item.cards)} size="xs" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{item.label}</p>
                    {item.note && <p className="text-caption text-[var(--text-muted)] leading-snug">{item.note}</p>}
                  </div>
                </div>
              ))}
            </div>
            {listenBelow}
          </div>
        )

      case 'spot':
        return (
          <div key={index} className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-mini uppercase tracking-wide text-[var(--text-muted)] mb-1">Tu mano</p>
                <CardRow cards={safeCards(block.hole)} size="sm" />
              </div>
              {block.board && (
                <div>
                  <p className="text-mini uppercase tracking-wide text-[var(--text-muted)] mb-1">Mesa</p>
                  <CardRow cards={safeCards(block.board)} size="sm" />
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {block.question}
              {listen}
            </p>
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-[var(--poker-gold)] hover:underline list-none">
                Ver la respuesta
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {richText(block.answer, seen)}
              </p>
            </details>
          </div>
        )

      case 'quiz':
        return <QuizBlock key={index} questions={block.questions} onComplete={onQuizComplete} />

      case 'drill':
        return (
          <Link
            key={index}
            // Dentro de una clase el ejercicio abre su práctica guiada;
            // fuera de ella, la mesa general con la configuración indicada.
            to={practicePath ?? `/app/play?seats=${block.seats}`}
            className="flex items-center gap-3 rounded-xl border border-[var(--poker-gold)]/40 bg-[var(--poker-gold)]/[0.07] p-4 transition-all duration-200 hover:bg-[var(--poker-gold)]/[0.12]"
          >
            <span className="grid place-items-center w-10 h-10 rounded-lg bg-[var(--poker-gold)]/15 text-[var(--poker-gold)] shrink-0">
              <Spade className="w-5 h-5" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{block.goal}</p>
              <p className="text-xs text-[var(--text-muted)]">
                Mesa de {block.seats} jugadores · {block.hands} manos sugeridas
                {practicePath ? ' · con la clase paso a paso al lado' : ''}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--poker-gold)] shrink-0" strokeWidth={2} />
          </Link>
        )

      case 'showcase':
        return (
          <div key={index}>
            <ShowcaseTabs id={block.id} />
            {listenBelow}
          </div>
        )

      case 'range':
        return (
          <div key={index}>
            <RangeBlock id={block.id} />
            {listenBelow}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6" ref={body}>
      {blocks.map((block, index) => {
        const isActive = activeIndex === index
        // Solo la tabla del bloque que suena marca su fila: el resto no cambia.
        const activeRow = isActive && block.type === 'table' ? tableRowForChunk(block, activeChunk) : null
        // Lo que dice la mesa con audio del paso, si la clase no está leyendo esta tabla.
        const sceneFocus =
          block.type === 'table' && activeRow === null && sceneCaption && index >= sceneCaption.from && index < sceneCaption.to
            ? tableFocusForText(block, sceneCaption.text)
            : null
        return (
          <div
            key={index}
            data-block-index={index}
            className={`group/block${isActive ? ' speech-active' : ''}`}
          >
            {renderBlock(block, index, activeRow, sceneFocus)}
            {renderAfter?.(index)}
          </div>
        )
      })}
    </div>
  )
}
