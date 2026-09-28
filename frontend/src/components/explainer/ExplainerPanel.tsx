// ──────────────────────────────────────────────
// ExplainerPanel — el modo explicativo de una clase.
//
// Va encima del reproductor de "Escuchar la clase".
// Cada clase empieza con él minimizado: una barra con
// los conceptos del paso, el interruptor "Mesas con
// audio" y el botón para desplegarlo. Desplegado
// enseña una mesa donde se juega una mano preparada
// que explica el concepto, frase a frase.
// "Mesas con audio" (activado por defecto) pone además
// mesas dentro de la clase, bajo los bloques que
// tratan un concepto (InlineExplainer), que toman la
// palabra cuando el audio de la clase llega a ellas.
//
// Cómo se sincroniza con la clase:
//  · al cambiar de paso, la mesa carga el concepto
//    más relevante de ese paso;
//  · con "Seguir la clase" activo, mientras suena el
//    audio de la clase, cuando se lee un bloque que
//    habla de un concepto la mesa lo representa (sin
//    voz, con subtítulos, para no pisar el audio);
//  · "Explicar con voz" pausa el audio de la clase y
//    narra la escena; "Repetir" la vuelve a empezar.
// ──────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Headphones, Link2, MonitorPlay } from 'lucide-react'
import { SCENES, findScene } from '@features/explainer/scenes'
import { bestScene, matchScenes } from '@features/explainer/match'
import { useExplainerPref } from '@features/explainer/prefs'
import { useScenePlayer } from '@features/explainer/useScenePlayer'
import type { ExplainerScene } from '@features/explainer/types'
import SceneStage, { Toggle } from './SceneStage'

export interface ExplainerPanelProps {
  /** Texto del paso a la vista (en español), para elegir el concepto. */
  stepText: string
  /** Texto de toda la clase: si el paso no trata ningún concepto, se usa este. */
  lessonText: string
  /** Bloque que está leyendo "Escuchar la clase", o `null` si no suena. */
  followText: string | null
  /** El audio de la clase está sonando. */
  lessonPlaying: boolean
  /** Antes de narrar la escena: aquí se pausa el audio de la clase. */
  onNarrate: () => void
}

export default function ExplainerPanel(props: ExplainerPanelProps) {
  // Minimizado al entrar en cada clase: se despliega a mano.
  const [expanded, setExpanded] = useState(false)
  const stepMatches = useMemo(() => matchScenes(props.stepText).slice(0, 3), [props.stepText])
  const concepts = stepMatches.map(match => match.scene)

  if (!expanded) return <ExplainerLauncher concepts={concepts} onOpen={() => setExpanded(true)} />
  return <OpenExplainer {...props} stepConcepts={concepts} onClose={() => setExpanded(false)} />
}

/** Panel minimizado: qué es, el interruptor de las mesas con audio y el botón para desplegarlo. */
function ExplainerLauncher({ concepts, onOpen }: { concepts: ExplainerScene[]; onOpen: () => void }) {
  const [enabled, setEnabled] = useExplainerPref('enabled')
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-3 pl-4 sm:flex-row sm:items-center">
      <span className="hidden sm:grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/12 text-emerald-400 shrink-0">
        <MonitorPlay className="w-5 h-5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Modo explicativo</p>
        <p className="text-xs text-[var(--text-muted)]">
          {concepts.length > 0
            ? `Mira en la mesa cómo se juega: ${concepts.map(scene => scene.title).join(' · ')}`
            : 'Mira en una mesa de póker cómo se juega lo que explica la clase.'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Toggle
          on={enabled}
          onChange={setEnabled}
          label="Mesas con audio"
          title="Mesas dentro de la clase que se abren y explican con voz cuando «Escuchar la clase» llega a ellas"
        >
          <Headphones className="w-3.5 h-3.5" strokeWidth={2} />
        </Toggle>
        <button
          type="button"
          onClick={onOpen}
          className="press flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 sm:flex-none"
          style={{ background: 'var(--poker-gold)' }}
        >
          <MonitorPlay className="w-4 h-4" strokeWidth={2.2} />
          Ver modo explicativo
        </button>
      </div>
    </div>
  )
}

interface OpenExplainerProps extends ExplainerPanelProps {
  stepConcepts: ExplainerScene[]
  onClose: () => void
}

function OpenExplainer({
  stepText,
  lessonText,
  followText,
  lessonPlaying,
  onNarrate,
  stepConcepts,
  onClose,
}: OpenExplainerProps) {
  const [follow, setFollow] = useExplainerPref('follow')

  const initial = stepConcepts[0] ?? bestScene(lessonText) ?? SCENES[0]
  const [sceneId, setSceneId] = useState(initial.id)
  const scene = findScene(sceneId) ?? SCENES[0]
  const player = useScenePlayer(scene)

  /** La escena nueva debe arrancar sola (al seguir la clase). */
  const [autoStart, setAutoStart] = useState(false)
  useEffect(() => {
    if (!autoStart) return
    setAutoStart(false)
    player.play('silent', 0)
    // Se lanza una vez por escena cargada.
  }, [autoStart, scene])

  // ── Paso nuevo: su concepto, si lo hay y no se está viendo otro ──
  const firstStepConcept = stepConcepts[0]?.id
  useEffect(() => {
    if (firstStepConcept && !player.playing) setSceneId(firstStepConcept)
    // Solo al cambiar de paso.
  }, [stepText])

  // ── Seguir la clase: lo que se lee, se representa ──
  const lastFollowed = useRef<string | null>(null)
  useEffect(() => {
    if (!follow || !lessonPlaying || !followText || followText === lastFollowed.current) return
    lastFollowed.current = followText
    const match = bestScene(followText)
    if (!match) return
    if (match.id !== sceneId) {
      setSceneId(match.id)
      setAutoStart(true)
    } else if (!player.playing && player.beat < 0) {
      player.play('silent', 0)
    }
  }, [follow, lessonPlaying, followText, sceneId, player])

  // El audio de la clase manda: si empieza a sonar, la narración se calla.
  useEffect(() => {
    if (lessonPlaying && player.mode === 'voice') player.pause()
  }, [lessonPlaying, player])

  const otherScenes = SCENES.filter(entry => !stepConcepts.some(concept => concept.id === entry.id))

  return (
    <section
      aria-label="Modo explicativo"
      className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-[var(--bg-panel)] shadow-lg shadow-black/10"
    >
      {/* ── Cabecera: concepto y cambio de concepto ── */}
      <header className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-2 border-b border-[var(--border)] px-3 py-2.5 sm:flex sm:px-4">
        <span className="flex items-center gap-1.5 text-caption font-bold uppercase tracking-wide text-emerald-400 whitespace-nowrap">
          <MonitorPlay className="w-3.5 h-3.5" strokeWidth={2.2} />
          Modo explicativo
        </span>

        <div className="col-span-2 row-start-2 flex flex-wrap items-center gap-1.5 min-w-0 sm:flex-1">
          {stepConcepts.map(concept => (
            <button
              key={concept.id}
              type="button"
              onClick={() => setSceneId(concept.id)}
              aria-pressed={concept.id === scene.id}
              className={`rounded-full border px-2.5 py-1 text-caption font-semibold transition ${
                concept.id === scene.id
                  ? 'border-[var(--poker-gold)] bg-[#f2a93b]/15 text-[var(--poker-gold)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-active)] hover:text-[var(--text-primary)]'
              }`}
            >
              {concept.title}
            </button>
          ))}
          <select
            value={stepConcepts.some(concept => concept.id === scene.id) ? '' : scene.id}
            onChange={event => event.target.value && setSceneId(event.target.value)}
            aria-label="Otros conceptos"
            className="max-w-full rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1 text-caption text-[var(--text-secondary)]"
          >
            <option value="">{stepConcepts.length > 0 ? 'Otros conceptos…' : 'Elegir concepto…'}</option>
            {otherScenes.map(entry => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            player.stop()
            onClose()
          }}
          className="col-start-2 row-start-1 justify-self-end flex items-center gap-1 rounded-lg px-2 py-1.5 text-caption text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition"
          title="Minimizar el modo explicativo"
          aria-label="Minimizar el modo explicativo"
        >
          Minimizar
          <ChevronDown className="w-3.5 h-3.5 rotate-180" strokeWidth={2} />
        </button>
      </header>

      <SceneStage
        scene={scene}
        player={player}
        onNarrate={onNarrate}
        toggles={
          <Toggle
            on={follow}
            onChange={setFollow}
            label="Seguir la clase"
            title="Mientras escuchas la clase, la mesa enseña lo que se está explicando"
          >
            <Link2 className="w-3.5 h-3.5" strokeWidth={2} />
          </Toggle>
        }
      />
    </section>
  )
}
