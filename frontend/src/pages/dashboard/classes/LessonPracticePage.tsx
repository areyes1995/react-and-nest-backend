// ──────────────────────────────────────────────
// LessonPracticePage — la clase, en la mesa.
// Route: /app/classes/:courseSlug/:lessonSlug/practica
//
// Leer una clase y jugar una mano son dos actividades
// distintas, y entre las dos se pierde lo aprendido.
// Aquí van juntas: la mesa en vivo a la izquierda y la
// clase troceada en pasos a la derecha, con el
// entrenamiento que le corresponde ya cargado y el
// coach corrigiendo cada decisión.
//
// El paso no avanza solo: lo mueve el estudiante
// cuando ha visto en la mesa lo que acaba de leer.
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Brain, Check, Play, RotateCcw, Target } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { ContentBlocks } from '@components/content'
import {
  ActionBar,
  CoachPanel,
  GuidedCoachModal,
  PokerTable,
  PositionStrip,
  TableFeed,
} from '@components/poker'
import { splitIntoSteps } from '@components/guide/LessonStepper'
import { totalPot } from '@poker/engine'
import { useCurriculum } from '@features/academy/CurriculumContext'
import { practiceForLesson } from '@features/academy/practice'
import { findDrill } from '@features/table/drills'
import { HERO_ID, useTableGame } from '@features/table/useTableGame'
import { useChipFormat } from '@features/table/TableDisplayContext'
import { useGuidedCoach } from '@features/table/useGuidedCoach'
import { TableThemeScope } from '@features/table/TableThemeContext'

export default function LessonPracticePage() {
  const { courseSlug, lessonSlug } = useParams()
  const { findCourse, findLesson } = useCurriculum()

  const course = courseSlug ? findCourse(courseSlug) : undefined
  const lesson = courseSlug && lessonSlug ? findLesson(courseSlug, lessonSlug) : undefined

  const practice = useMemo(
    () => (lesson ? practiceForLesson(lesson, course?.level) : null),
    [lesson, course?.level],
  )

  // La mesa arranca ya configurada para lo que se practica: sin este paso el
  // estudiante tendría que reproducir a mano la configuración de la clase.
  const game = useTableGame({
    seats: practice?.seats ?? 6,
    drillId: practice?.drillId ?? 'free',
    trainingMode: true,
  })
  const formatChips = useChipFormat(game.state.config.bigBlind)

  // Los pasos son los mismos apartados de la clase, sin el test ni el enlace al
  // ejercicio: aquí el ejercicio ya está ocurriendo.
  const steps = useMemo(() => {
    if (!lesson) return []
    return splitIntoSteps(
      lesson.blocks.filter(block => block.type !== 'quiz' && block.type !== 'drill'),
    )
  }, [lesson])

  const [index, setIndex] = useState(0)

  // Preguntas guiadas: siempre en los entrenamientos que las exigen (práctica
  // integral) y a elección del estudiante en el resto de clases.
  const drillGuided = findDrill(practice?.drillId).guided === true
  const [guidedChoice, setGuidedChoice] = useState(false)
  const guided = useGuidedCoach(game.state, HERO_ID, game.isHeroTurn, drillGuided || guidedChoice)

  if (!course || !lesson || !practice) return <Navigate to="/app/classes" replace />

  const drill = findDrill(practice.drillId)
  const step = steps[index]
  const isLast = index >= steps.length - 1
  const handsRatio = Math.min(1, game.session.handsPlayed / Math.max(1, practice.hands))

  return (
    <AcademyPage
      title={lesson.title}
      subtitle={`Práctica guiada · ${course.title} · ${drill.title}`}
      fill
      actions={
        <Link
          to={`/app/classes/${course.slug}/${lesson.slug}`}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
        >
          <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
          Volver a la clase
        </Link>
      }
    >
      {/* Mismo escenario que la mesa libre: `play-shell`/`play-grid` encajan la
          mesa en el alto disponible (PokerTable `fit`) para que las acciones
          estén siempre a la vista sin hacer scroll. El panel lateral (objetivo
          + pasos de la clase) hace scroll por su cuenta. */}
      <TableThemeScope className="play-shell flex-1 min-h-0">
        <div className="play-grid">
        {/* ── Mesa en vivo ── */}
        <div className="play-stage">
          <div className="min-h-0 flex-1">
            <PokerTable
              state={game.state}
              heroId={HERO_ID}
              timeLeft={game.turnProgress}
              revealAll={false}
              heroDelta={game.heroDelta}
              fit
            />
          </div>

          <div className="flex shrink-0 items-center gap-2 px-1 pb-2">
            <TableFeed events={game.events} className="min-w-0 flex-1" />
          </div>

          <div className="play-actions min-h-[9.25rem]">
            {game.busted ? (
              <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-5 text-center">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Te has quedado sin fichas.
                </p>
                <button
                  type="button"
                  onClick={game.restart}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-black"
                  style={{ background: 'var(--poker-gold)' }}
                >
                  <RotateCcw className="h-4 w-4" strokeWidth={2} />
                  Seguir practicando
                </button>
              </div>
            ) : game.handOver ? (
              <div className="flex h-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-4 py-3">
                <p className="text-sm text-[var(--text-primary)]">
                  Mano terminada · tu stack {formatChips(game.state.players.find(p => p.id === HERO_ID)?.stack ?? 0)}
                </p>
                <button
                  type="button"
                  onClick={game.dealNext}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-black"
                  style={{ background: 'var(--poker-gold)' }}
                >
                  <Play className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                  Siguiente mano
                </button>
              </div>
            ) : (
              <ActionBar
                legal={game.legal}
                pot={totalPot(game.state)}
                currentBet={game.state.currentBet}
                bigBlind={game.settings.bigBlind}
                disabled={!game.isHeroTurn || guided.isOpen}
                onAction={game.act}
              />
            )}
          </div>
        </div>

        {/* ── La clase, paso a paso ── */}
        <aside className="play-aside space-y-4">
          <PositionStrip state={game.state} heroId={HERO_ID} />
          {/* Objetivo de la sesión */}
          <section className="space-y-2.5 rounded-xl border border-[var(--poker-gold)]/40 bg-[var(--poker-gold)]/[0.06] p-4">
            <div className="flex items-start gap-2">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-[var(--poker-gold)]" strokeWidth={2} />
              <div className="min-w-0">
                <p className="text-mini font-semibold uppercase tracking-wide text-[var(--poker-gold)]">
                  Objetivo
                </p>
                <p className="text-sm leading-snug text-[var(--text-primary)]">{practice.goal}</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-mini text-[var(--text-muted)]">
                <span>{drill.title}</span>
                <span className="tabular-nums">
                  {game.session.handsPlayed}/{practice.hands} manos
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-surface)]">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${handsRatio * 100}%`, background: 'var(--poker-gold)' }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--poker-gold)]/20 pt-2.5">
              <label className="flex flex-1 cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={drillGuided || guidedChoice}
                  disabled={drillGuided}
                  onChange={event => setGuidedChoice(event.target.checked)}
                  className="accent-[var(--poker-gold)]"
                />
                Preguntas guiadas antes de actuar
              </label>
              {guided.enabled && (
                <button
                  type="button"
                  onClick={guided.open}
                  disabled={!guided.spot}
                  className="flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-40"
                >
                  <Brain className="h-3.5 w-3.5" />
                  Piensa
                </button>
              )}
            </div>

            <div className="flex gap-3 text-caption">
              <span className="text-emerald-400">{game.session.correct} aciertos</span>
              <span className="text-red-400">{game.session.mistakes} fallos</span>
              {game.session.bestStreak > 1 && (
                <span className="ml-auto text-[var(--text-muted)]">
                  racha {game.session.bestStreak}
                </span>
              )}
            </div>
          </section>

          {/* Pasos de la clase */}
          {step && (
            <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)]">
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
                <span className="text-mini font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Paso {index + 1} de {steps.length}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--text-primary)]">
                  {step.title}
                </span>
              </div>

              {/* Segmentos de progreso: se ve cuánto queda de la clase. */}
              <div className="flex gap-1 px-4 pt-2.5">
                {steps.map((_, position) => (
                  <span
                    key={position}
                    className="h-1 flex-1 rounded-full transition-colors"
                    style={{
                      background:
                        position <= index ? 'var(--poker-gold)' : 'var(--bg-surface)',
                    }}
                  />
                ))}
              </div>

              {/* El contenido puede ser largo: scroll propio, la mesa no se mueve. */}
              <div className="max-h-[23.75rem] overflow-y-auto px-4 py-3">
                <ContentBlocks blocks={step.blocks} />
              </div>

              <div className="flex items-center gap-2 border-t border-[var(--border)] px-4 py-2.5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => setIndex(current => Math.max(0, current - 1))}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-caption text-[var(--text-muted)] transition hover:text-[var(--text-primary)] disabled:opacity-30"
                >
                  <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                  Anterior
                </button>

                {isLast ? (
                  <Link
                    to={`/app/classes/${course.slug}/${lesson.slug}`}
                    className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-caption font-semibold text-black"
                    style={{ background: 'var(--poker-gold)' }}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Terminar y volver
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIndex(current => Math.min(steps.length - 1, current + 1))}
                    className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-caption font-semibold text-black"
                    style={{ background: 'var(--poker-gold)' }}
                  >
                    Siguiente paso
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Corrección de cada decisión */}
          <CoachPanel feedback={game.feedback} enabled />
        </aside>
        </div>
      </TableThemeScope>

      {guided.spot && (
        <GuidedCoachModal
          spot={guided.spot}
          isOpen={guided.isOpen}
          onClose={guided.close}
          onAnswer={guided.answer}
          heroCards={game.state.players.find(p => p.id === HERO_ID)?.holeCards ?? []}
          board={game.state.board}
          stats={guided.stats}
        />
      )}
    </AcademyPage>
  )
}
