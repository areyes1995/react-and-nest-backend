// ──────────────────────────────────────────────
// LessonStepper — la clase, paso a paso.
//
// Una clase entera de golpe es un muro de texto: el
// estudiante no sabe cuánto queda ni dónde estaba.
// El stepper la parte por sus propios apartados y
// muestra uno cada vez, con el mapa arriba y un
// único botón abajo.
//
// El corte no es arbitrario: cada `heading` del
// contenido abre un paso, y los tests se quedan
// siempre solos en el suyo para que nadie los
// responda de pasada.
//
// Quien prefiera leer del tirón tiene el interruptor
// "Ver clase completa"; la preferencia se recuerda.
//
// Arriba va el reproductor de "Escuchar la clase":
// lee en voz alta lo que hay en pantalla, resalta el
// bloque que suena y, si se quiere, pasa solo al
// paso siguiente al terminar.
//
// Encima del reproductor, el modo explicativo
// (components/explainer): una mesa que representa
// los conceptos del paso y sigue al audio.
// ──────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlignLeft, ArrowLeft, ArrowRight, Check, ListChecks, Zap } from 'lucide-react'
import ContentBlocks, { type BlockAudio } from '@components/content/ContentBlocks'
import ReadAloudBar from '@components/content/ReadAloudBar'
import ExplainerPanel from '@components/explainer/ExplainerPanel'
import InlineExplainer from '@components/explainer/InlineExplainer'
import { lessonAnchors } from '@features/explainer/match'
import type { ExplainerScene } from '@features/explainer/types'
import { useExplainerPref } from '@features/explainer/prefs'
import { blockToSpeech, chunkForSpeech } from '@features/speech/lessonScript'
import { useReadAloud } from '@features/speech/useReadAloud'
import type { ContentBlock } from '@features/academy/types'
import { useGuide } from '@features/guide'

/** Título del paso que agrupa lo que va antes del primer encabezado. */
const INTRO_TITLE = 'Introducción'

interface Step {
  title: string
  blocks: ContentBlock[]
  /** El paso contiene un test: cambia el icono y el texto del botón. */
  isQuiz: boolean
}

/**
 * El paso retiene el audio al acabar: trae algo que pide interactuar
 * (responder el test, revelar una respuesta, ir a practicar a la mesa) y
 * pasar solo al siguiente arrancaría al estudiante antes de hacerlo. En ese
 * caso el audio se para ahí; si no, puede seguir solo al paso siguiente.
 */
export function stepHoldsAudio(step: Step | undefined): boolean {
  return (
    step?.blocks.some(
      block => block.type === 'quiz' || block.type === 'spot' || block.type === 'drill' || block.type === 'showcase',
    ) ?? false
  )
}

/**
 * Parte los bloques en pasos. Abre paso nuevo en cada encabezado y aísla los
 * tests. Si la clase no tiene encabezados, queda en un único paso — que es lo
 * correcto: no hay nada que trocear.
 */
export function splitIntoSteps(blocks: ContentBlock[]): Step[] {
  const steps: Step[] = []
  let current: Step | undefined

  for (const block of blocks) {
    if (block.type === 'heading') {
      current = { title: block.text, blocks: [], isQuiz: false }
      steps.push(current)
      continue
    }
    if (block.type === 'quiz') {
      steps.push({ title: 'Comprueba lo aprendido', blocks: [block], isQuiz: true })
      current = undefined
      continue
    }
    if (!current) {
      current = { title: INTRO_TITLE, blocks: [], isQuiz: false }
      steps.push(current)
    }
    current.blocks.push(block)
  }

  return steps.filter(step => step.blocks.length > 0)
}

export interface LessonStepperProps {
  blocks: ContentBlock[]
  /**
   * Los mismos bloques en español (idioma fuente). El guion de audio se escribe
   * con ellos y se traduce al idioma del audio; sin ellos se usa `blocks`.
   */
  sourceBlocks?: ContentBlock[]
  onQuizComplete?: (result: { correct: number; total: number }) => void
  /** Ruta de la práctica guiada de esta clase, para el bloque de ejercicio. */
  practicePath?: string
  /** Se llama al terminar el último paso. */
  onFinish: () => void
  /** Texto del botón final. */
  finishLabel: string
  /** La clase ya estaba completada: el botón final cambia de tono. */
  completed: boolean
  /** Título de la clase en español: dice de qué va, para el modo explicativo. */
  lessonTitle?: string
  /**
   * Mesas del modo explicativo dentro del texto. Las prácticas no las llevan:
   * presentan un ejercicio, no explican un concepto (queda el panel principal).
   */
  inlineTables?: boolean
  /**
   * Admite en el texto las mesas de iniciación (calles, ciegas, acciones):
   * solo en el nivel de fundamentos. En el panel principal siempre están.
   */
  basicTables?: boolean
}

export default function LessonStepper({
  blocks,
  sourceBlocks,
  onQuizComplete,
  practicePath,
  onFinish,
  finishLabel,
  completed,
  lessonTitle = '',
  inlineTables = true,
  basicTables = true,
}: LessonStepperProps) {
  const { state, setGuidedReading } = useGuide()
  const steps = useMemo(() => splitIntoSteps(blocks), [blocks])

  const [index, setIndex] = useState(0)
  // Solo se puede saltar a un paso ya alcanzado: adelante se va leyendo.
  const [reached, setReached] = useState(0)

  const guided = state.guidedReading && steps.length > 1

  // ── Lectura en voz alta ──
  // Se lee lo que hay en pantalla: el paso actual o la clase entera.
  // El guion sale de los bloques en español: misma estructura que `blocks`,
  // así que los pasos y los índices coinciden.
  const scriptBlocks = sourceBlocks && sourceBlocks.length === blocks.length ? sourceBlocks : blocks
  const scriptSteps = useMemo(() => splitIntoSteps(scriptBlocks), [scriptBlocks])
  const segments = useMemo(() => {
    const step = scriptSteps[index] ?? scriptSteps[0]
    const visible = guided && step ? step.blocks : scriptBlocks
    const spoken = visible.map(blockToSpeech)
    // En modo paso a paso el título del paso no es un bloque: se antepone.
    if (guided && step && spoken.length > 0) spoken[0] = `${step.title}. ${spoken[0]}`
    return spoken
  }, [scriptBlocks, scriptSteps, guided, index])

  const [autoAdvance, setAutoAdvance] = useState(() => {
    try {
      return localStorage.getItem('read-aloud-auto') !== '0'
    } catch {
      return true
    }
  })
  /** Al pasar de paso por la voz, el paso nuevo empieza a sonar solo. */
  const continueReading = useRef(false)

  const reader = useReadAloud(segments, {
    resetKey: `${guided ? 'g' : 'f'}-${index}`,
    onEnd: () => {
      // En paso a paso el audio pasa solo al siguiente… salvo que el paso
      // pida interactuar: ahí se para para responder, revelar o practicar.
      if (guided && autoAdvance && index < steps.length - 1 && !stepHoldsAudio(steps[index])) {
        continueReading.current = true
        goTo(index + 1)
      }
    },
  })

  useEffect(() => {
    if (continueReading.current) {
      continueReading.current = false
      reader.play(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // El bloque que suena se mantiene a la vista.
  useEffect(() => {
    if (reader.current === null) return
    document
      .querySelector(`[data-lesson-body] [data-block-index="${reader.current}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [reader.current])

  // Trozo del audio dentro del bloque que suena: marca la fila de la tabla.
  // En paso a paso el primer bloque se lee con el título del paso delante:
  // esos trozos no son de la tabla y se descuentan.
  const titlePrefix = useMemo(
    () => (guided ? chunkForSpeech(`${scriptSteps[index]?.title ?? ''}.`).length : 0),
    [guided, scriptSteps, index],
  )
  const activeChunk =
    reader.current === null || reader.chunk === null
      ? null
      : reader.current === 0 && guided
        ? reader.chunk - titlePrefix
        : reader.chunk

  // ── Modo explicativo ──
  // Recibe el texto en español (el guion): el mismo con el que se elige la voz,
  // así el concepto se detecta igual en cualquier idioma de la interfaz.
  const lessonText = useMemo(() => scriptBlocks.map(blockToSpeech).join(' '), [scriptBlocks])
  const stepText = segments.join(' ')
  const lessonPlaying = reader.status === 'playing'
  const pauseLesson = () => {
    if (reader.status === 'playing') reader.pause()
  }

  // Con el modo abierto, además del panel de arriba van mesas dentro de la
  // clase, bajo los bloques que tratan un concepto con claridad. Los tests y
  // los ejercicios no se analizan.
  const [explainerOpen] = useExplainerPref('enabled')
  // Una mesa como mucho por paso, y solo para un concepto que sea el tema:
  // en un apartado con título, su título ("Defensa contra un 4-bet" no es un
  // apartado sobre faroles aunque la clase se llame "…valor, farol y
  // defensa"); en la introducción, el título de la clase. Cada concepto sale
  // una sola vez en la clase (ver `lessonAnchors`), se lea paso a paso o entera.
  const anchors = useMemo(() => {
    if (!explainerOpen || !inlineTables) return new Map<number, ExplainerScene>()
    const skip = (block: ContentBlock) =>
      block.type === 'quiz' || block.type === 'drill' || block.type === 'showcase' || block.type === 'range'
    const options = { lessonTitle, introductory: basicTables }

    if (guided) {
      // Todos los pasos, para no repetir un concepto que ya tuvo mesa antes.
      const sections = scriptSteps.map(step => {
        const texts = step.blocks.map(block => (skip(block) ? null : blockToSpeech(block)))
        if (texts[0]) texts[0] = `${step.title}. ${texts[0]}`
        return { title: step.title, intro: step.title === INTRO_TITLE, texts }
      })
      return lessonAnchors(sections, options)[index] ?? new Map<number, ExplainerScene>()
    }

    // Clase entera: los apartados los abren los encabezados; los índices son
    // los de la clase completa.
    const bounds: { start: number; title: string }[] = [{ start: 0, title: INTRO_TITLE }]
    scriptBlocks.forEach((block, i) => {
      if (block.type === 'heading') bounds.push({ start: i, title: block.text })
    })
    const sections = bounds.map((bound, n) => {
      const end = bounds[n + 1]?.start ?? scriptBlocks.length
      return {
        title: bound.title,
        intro: n === 0,
        texts: scriptBlocks.map((block, i) => (i >= bound.start && i < end && !skip(block) ? segments[i] : null)),
      }
    })
    const result = new Map<number, ExplainerScene>()
    for (const section of lessonAnchors(sections, options)) {
      for (const [blockIndex, scene] of section) result.set(blockIndex, scene)
    }
    return result
  }, [explainerOpen, inlineTables, guided, scriptSteps, scriptBlocks, segments, index, lessonTitle, basicTables])

  // ── Relevo de audio con las mesas de la clase ──
  // Con el modo abierto y "Seguir la clase" activo, cuando la lectura llega a
  // un bloque con mesa debajo, la clase se pausa y habla la mesa: su
  // explicación sustituye a la del bloque. Al terminar, la clase sigue desde
  // el bloque siguiente (o pasa al paso siguiente si era el último).
  const [followClass] = useExplainerPref('follow')
  const relayEnabled = explainerOpen && followClass
  const [relay, setRelay] = useState<{ block: number; token: number } | null>(null)
  /** Bloque ya cedido en esta lectura: si el estudiante reanuda la clase ahí, se lee normal. */
  const relayedBlock = useRef<string | null>(null)
  const relayKey = (block: number) => `${guided ? 'g' : 'f'}-${index}-${block}`

  useEffect(() => {
    if (reader.current === null) {
      relayedBlock.current = null
      return
    }
    if (relayedBlock.current && relayedBlock.current !== relayKey(reader.current)) relayedBlock.current = null
    if (!relayEnabled || reader.status !== 'playing' || !anchors.has(reader.current)) return
    if (relayedBlock.current === relayKey(reader.current)) return
    relayedBlock.current = relayKey(reader.current)
    reader.pause()
    setRelay({ block: reader.current, token: Date.now() })
    // `reader` cambia en cada render; lo que importa es el bloque que suena.
  }, [reader.current, reader.status, relayEnabled, anchors])

  // Cambiar de paso cancela un relevo pendiente.
  useEffect(() => setRelay(null), [index, guided])

  const finishRelay = (block: number, played: boolean) => {
    setRelay(null)
    if (!played) {
      // La mesa no se explicó (estaba oculta o se ocultó): la clase lee el bloque.
      reader.resume()
      return
    }
    if (block + 1 < segments.length) {
      reader.play(block + 1)
      return
    }
    // La mesa cerraba el paso: igual que al acabar el audio, solo se avanza
    // si el paso no pide interactuar; si no, el audio se para ahí.
    if (guided && autoAdvance && index < steps.length - 1 && !stepHoldsAudio(steps[index])) {
      continueReading.current = true
      goTo(index + 1)
      return
    }
    reader.stop()
  }

  // Las mesas de la clase empiezan minimizadas; la que se despliega (a mano o
  // porque le llegó el audio) se queda así mientras dure la clase.
  const [expandedTables, setExpandedTables] = useState<ReadonlySet<string>>(() => new Set())
  const setTableExpanded = (key: string, expanded: boolean) =>
    setExpandedTables(current => {
      if (current.has(key) === expanded) return current
      const next = new Set(current)
      if (expanded) next.add(key)
      else next.delete(key)
      return next
    })

  // ── Tablas que siguen a la mesa ──
  // Mientras una mesa de la clase explica algo, las tablas de su mismo paso
  // (o de su apartado, en la clase completa) marcan la fila o la columna de lo
  // que está diciendo.
  const [sceneCaption, setSceneCaption] = useState<{ block: number; text: string } | null>(null)
  useEffect(() => setSceneCaption(null), [index, guided])

  const updateSceneCaption = (block: number, text: string | null) =>
    setSceneCaption(current => {
      if (text) return current?.block === block && current.text === text ? current : { block, text }
      // Solo la mesa que la puso la quita: otra que se cierra no borra la frase en curso.
      return current?.block === block ? null : current
    })

  const sceneRange = useMemo(() => {
    if (!sceneCaption) return null
    if (guided) return { text: sceneCaption.text, from: 0, to: steps[index]?.blocks.length ?? 0 }
    // Clase completa: el apartado de la mesa, entre dos encabezados.
    let from = 0
    let to = blocks.length
    blocks.forEach((block, i) => {
      if (block.type !== 'heading') return
      if (i <= sceneCaption.block) from = i
      else if (i < to) to = i
    })
    return { text: sceneCaption.text, from, to }
  }, [sceneCaption, guided, blocks, steps, index])

  const renderAnchor = (blockIndex: number) => {
    const scene = anchors.get(blockIndex)
    if (!scene) return null
    const tableKey = `${index}-${blockIndex}-${scene.id}`
    return (
      <InlineExplainer
        key={tableKey}
        expanded={expandedTables.has(tableKey)}
        onExpandedChange={expanded => setTableExpanded(tableKey, expanded)}
        scene={scene}
        handoff={relay?.block === blockIndex ? relay.token : 0}
        onHandoffEnd={played => finishRelay(blockIndex, played)}
        lessonPlaying={lessonPlaying}
        onNarrate={pauseLesson}
        onCaptionChange={text => updateSceneCaption(blockIndex, text)}
      />
    )
  }

  // ── Escuchar desde cualquier bloque ──
  // Cada texto o tabla lleva al final un botón que arranca el audio de la
  // clase desde ahí (o lo pausa si es el bloque que está sonando).
  const blockAudio: BlockAudio | undefined = reader.supported
    ? {
        canPlay: blockIndex => Boolean(segments[blockIndex]?.trim()),
        playing: lessonPlaying,
        onPlay: blockIndex => reader.play(blockIndex),
        onPause: () => reader.pause(),
      }
    : undefined

  const explainer = (
    <ExplainerPanel
      stepText={stepText}
      lessonText={lessonText}
      // Si el bloque que suena tiene su propia mesa debajo, la representa ella.
      followText={
        reader.current !== null && !anchors.has(reader.current) ? (segments[reader.current] ?? null) : null
      }
      lessonPlaying={lessonPlaying}
      onNarrate={pauseLesson}
    />
  )

  const readAloudBar = (
    <ReadAloudBar
      reader={reader}
      total={segments.length}
      autoAdvance={
        guided
          ? {
              value: autoAdvance,
              onChange: value => {
                setAutoAdvance(value)
                try {
                  localStorage.setItem('read-aloud-auto', value ? '1' : '0')
                } catch {
                  /* solo en memoria */
                }
              },
            }
          : undefined
      }
    />
  )

  function goTo(target: number) {
    setIndex(target)
    setReached(current => Math.max(current, target))
    // El paso nuevo empieza arriba: seguir a media altura desorienta.
    document.querySelector('[data-lesson-top]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const modeToggle = (
    <button
      type="button"
      onClick={() => setGuidedReading(!state.guidedReading)}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-caption font-medium text-[var(--text-muted)] bg-[var(--bg-surface-soft)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition shrink-0"
    >
      {state.guidedReading ? (
        <>
          <AlignLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Ver clase completa
        </>
      ) : (
        <>
          <ListChecks className="w-3.5 h-3.5" strokeWidth={1.5} />
          Leer paso a paso
        </>
      )}
    </button>
  )

  const finishButton = (
    <button
      type="button"
      onClick={onFinish}
      className={`press w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition ${
        completed
          ? 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
          : 'text-black hover:brightness-110'
      }`}
      style={completed ? undefined : { background: 'var(--poker-gold)' }}
    >
      {completed ? (
        <>
          <Check className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
          {finishLabel}
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" strokeWidth={2} />
          {finishLabel}
        </>
      )}
    </button>
  )

  // ── Modo lectura completa ──
  if (!guided) {
    return (
      <div className="space-y-6">
        {explainer}
        {readAloudBar}
        <div className="flex justify-end">{modeToggle}</div>
        <div data-lesson-body>
          <ContentBlocks
            blocks={blocks}
            onQuizComplete={onQuizComplete}
            practicePath={practicePath}
            activeIndex={reader.current}
            activeChunk={activeChunk}
            renderAfter={renderAnchor}
            sceneCaption={sceneRange}
            blockAudio={blockAudio}
          />
        </div>
        <div className="pt-2 border-t border-[var(--border)]">{finishButton}</div>
      </div>
    )
  }

  const step = steps[index]
  const isLast = index === steps.length - 1

  return (
    <div className="space-y-5" data-lesson-top>
      {explainer}
      {readAloudBar}

      {/* ── Mapa de la clase ── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-3 space-y-2.5">
        <div className="flex items-center gap-3">
          <p className="text-caption uppercase tracking-wide text-[var(--text-muted)] font-semibold">
            Paso {index + 1} de {steps.length}
          </p>
          <p className="text-caption text-[var(--text-primary)] font-medium truncate flex-1">
            {step.title}
          </p>
          {modeToggle}
        </div>

        {/* Segmentos: uno por paso, clicables hacia atrás. */}
        <div className="flex items-center gap-1">
          {steps.map((entry, entryIndex) => {
            const visited = entryIndex <= reached
            return (
              <button
                key={entry.title + entryIndex}
                type="button"
                disabled={!visited}
                onClick={() => goTo(entryIndex)}
                title={entry.title}
                aria-label={`Paso ${entryIndex + 1}: ${entry.title}`}
                aria-current={entryIndex === index ? 'step' : undefined}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  visited ? 'cursor-pointer' : 'cursor-default'
                }`}
                style={{
                  background:
                    entryIndex === index
                      ? 'var(--poker-gold)'
                      : entryIndex < index
                        ? 'color-mix(in srgb, var(--poker-gold) 45%, transparent)'
                        : 'var(--bg-surface)',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* ── El paso ── */}
      <div key={index} className="animate-fade-in" data-lesson-body>
        {!step.isQuiz && (
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{step.title}</h2>
        )}
        <ContentBlocks
          blocks={step.blocks}
          onQuizComplete={onQuizComplete}
          practicePath={practicePath}
          activeIndex={reader.current}
          activeChunk={activeChunk}
          renderAfter={renderAnchor}
          sceneCaption={sceneRange}
          blockAudio={blockAudio}
        />
      </div>

      {/* ── Avanzar ── */}
      <div className="pt-3 border-t border-[var(--border)] space-y-3">
        {isLast ? (
          finishButton
        ) : (
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="press w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-black transition hover:brightness-110"
            style={{ background: 'var(--poker-gold)' }}
          >
            Siguiente paso: {steps[index + 1].title}
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        )}

        {index > 0 && (
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Volver a «{steps[index - 1].title}»
          </button>
        )}
      </div>
    </div>
  )
}
