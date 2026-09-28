// ──────────────────────────────────────────────
// PlayPage — la mesa de práctica.
// Mesa jugable de 2 a 9 jugadores, panel de
// entrenamiento con el análisis de cada decisión e
// historial de la mano. Todo el estado lo lleva el
// motor: aquí solo se dibuja y se recogen acciones.
//
// La mesa se encaja en el alto disponible (PokerTable
// `fit`) para que las acciones estén siempre a la vista
// sin hacer scroll, en monitor y en móvil. La
// configuración (partida, fichas/BB, estilo) está en
// el engranaje de la mesa. La zona de
// acción reserva su alto: al terminar una mano cambia de
// contenido y, si variara, la mesa daría un salto.
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bot, Brain, Cpu, Gauge, GraduationCap, Grid3x3, RotateCcw, Target, Users, Play } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { FreeModeModal } from '@components/access'
import { useAccess } from '@features/access/AccessContext'
import {
  ActionBar,
  CoachPanel,
  GuidedCoachModal,
  HandLog,
  OpponentsPanel,
  PokerTable,
  PositionStrip,
  RangeChartModal,
  TableFeed,
  TrainerBox,
} from '@components/poker'
import { TableThemeScope } from '@features/table/TableThemeContext'
import { useChipFormat } from '@features/table/TableDisplayContext'
import { handNotation, positionName, totalPot } from '@poker/engine'
import type { DifficultyId } from '@poker/engine'
import {
  DEFAULT_SETTINGS,
  HERO_ID,
  useTableGame,
  type GameSpeed,
  type OpponentMode,
} from '@features/table/useTableGame'
import { findDrill } from '@features/table/drills'
import { useGuidedCoach } from '@features/table/useGuidedCoach'

const DIFFICULTY_LABELS: { id: DifficultyId; label: string; hint: string }[] = [
  { id: 'beginner', label: 'Principiante', hint: 'Rivales pasivos que pagan de más' },
  { id: 'intermediate', label: 'Intermedio', hint: 'Mezcla de sólidos y pasivos' },
  { id: 'advanced', label: 'Avanzado', hint: 'Agresivos y difíciles de farolear' },
  { id: 'pro', label: 'Profesional', hint: 'Mesa dura, sin regalos' },
]

const SPEEDS: { id: GameSpeed; label: string }[] = [
  { id: 'slow', label: 'Lenta' },
  { id: 'normal', label: 'Normal' },
  { id: 'fast', label: 'Rápida' },
]

const BLIND_LEVELS = [
  { small: 5, big: 10 },
  { small: 25, big: 50 },
  { small: 50, big: 100 },
  { small: 100, big: 200 },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-caption font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </span>
      {children}
    </div>
  )
}

export default function PlayPage() {
  const [params] = useSearchParams()
  const requestedSeats = Number(params.get('seats'))

  const game = useTableGame({
    seats:
      Number.isFinite(requestedSeats) && requestedSeats >= 2 && requestedSeats <= 9
        ? requestedSeats
        : DEFAULT_SETTINGS.seats,
  })

  const { state, settings, updateSettings, aiStatus } = game
  const hero = state.players.find(player => player.id === HERO_ID)
  const formatChips = useChipFormat(state.config.bigBlind)

  // La URL manda: entrar desde una práctica de una clase configura la mesa.
  useEffect(() => {
    if (
      Number.isFinite(requestedSeats) &&
      requestedSeats >= 2 &&
      requestedSeats <= 9 &&
      requestedSeats !== settings.seats
    ) {
      updateSettings({ seats: requestedSeats })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedSeats])

  const select =
    'w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-active)]'

  const aiReady = aiStatus?.ready === true
  const aiHint = aiStatus?.enabled
    ? aiStatus.issues.join(' ')
    : 'Sin IA: activa POKER_AI_ENABLED en el .env del backend.'

  // Un entrenamiento activo enciende el coach aunque el interruptor general
  // esté apagado: sin análisis el entrenamiento no corrige nada.
  const drill = findDrill(settings.drillId)
  const coachEnabled = settings.trainingMode || drill.id !== 'free'

  const opponentModes: { id: OpponentMode; label: string; icon: typeof Bot }[] = [
    { id: 'bots', label: 'Bots', icon: Bot },
    { id: 'ai', label: 'IA', icon: Cpu },
  ]

  const [rangesOpen, setRangesOpen] = useState(false)
  const heroPosition = hero ? positionName(state, hero.seat) : null
  const heroHand = hero && hero.holeCards.length === 2 ? handNotation(hero.holeCards) : null

  // Preguntas guiadas: por ajuste o porque el entrenamiento las exige.
  const guided = useGuidedCoach(state, HERO_ID, game.isHeroTurn, settings.guided || drill.guided === true)

  // Plan gratis: la mesa se ve pero no se juega. Cualquier botón o control
  // (acciones, rango, engranaje, panel…) abre el aviso en vez de actuar, y los
  // atajos de teclado de las acciones también.
  const { canUse, status: accessStatus } = useAccess()
  const demo = accessStatus === 'ready' && !canUse('play')
  const [freeNotice, setFreeNotice] = useState(false)
  const interceptDemo = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('button, input, select, textarea, label, a, [role="button"], [role="tab"]')) return
    event.preventDefault()
    event.stopPropagation()
    setFreeNotice(true)
  }

  // Ajustes de esta partida: van en la pestaña «Partida» del engranaje de la
  // mesa, junto a los generales (fichas/BB, estilo), para dejar el panel
  // lateral para lo que se consulta jugando.
  const practiceSettings = (
    <div className="space-y-3.5">
      <Field label="Quién juega los rivales">
        <div className="flex gap-1.5">
          {opponentModes.map(mode => {
            const disabled = mode.id === 'ai' && !aiReady
            return (
              <button
                key={mode.id}
                type="button"
                disabled={disabled}
                onClick={() => updateSettings({ opponentMode: mode.id })}
                className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-caption font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  settings.opponentMode === mode.id
                    ? 'bg-[var(--poker-gold)] text-black'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <mode.icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                {mode.label}
              </button>
            )
          })}
        </div>
        <p className="text-mini text-[var(--text-muted)] leading-snug">
          {aiReady
            ? `IA disponible: ${aiStatus?.model} vía ${aiStatus?.provider}.`
            : aiStatus?.enabled
              ? aiStatus.issues.join(' ')
              : 'Para jugar contra una IA, activa POKER_AI_ENABLED en el .env del backend.'}
        </p>
      </Field>

      <Field label={`Jugadores: ${settings.seats}`}>
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} />
          <input
            type="range"
            min={2}
            max={9}
            step={1}
            value={settings.seats}
            onChange={event => updateSettings({ seats: Number(event.target.value) })}
            className="flex-1 accent-[var(--poker-gold)]"
            aria-label="Número de jugadores"
          />
        </div>
        <div className="flex justify-between text-mini text-[var(--text-muted)] px-5">
          <span>2</span>
          <span>9</span>
        </div>
      </Field>

      <Field label="Nivel de los rivales">
        <select
          value={settings.difficulty}
          onChange={event => updateSettings({ difficulty: event.target.value as DifficultyId })}
          className={select}
        >
          {DIFFICULTY_LABELS.map(option => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-mini text-[var(--text-muted)]">
          {DIFFICULTY_LABELS.find(option => option.id === settings.difficulty)?.hint}
        </p>
      </Field>

      <Field label="Ciegas">
        <select
          value={`${settings.smallBlind}/${settings.bigBlind}`}
          onChange={event => {
            const [small, big] = event.target.value.split('/').map(Number)
            updateSettings({ smallBlind: small, bigBlind: big })
          }}
          className={select}
        >
          {BLIND_LEVELS.map(level => (
            <option key={level.big} value={`${level.small}/${level.big}`}>
              {level.small} / {level.big}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Velocidad">
        <div className="flex gap-1.5">
          {SPEEDS.map(speed => (
            <button
              key={speed.id}
              type="button"
              onClick={() => updateSettings({ speed: speed.id })}
              className={`flex-1 px-2 py-1.5 rounded-lg text-caption font-medium transition ${
                settings.speed === speed.id
                  ? 'bg-[var(--poker-gold)] text-black'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {speed.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Manos de acción">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.actionHands}
            onChange={event => updateSettings({ actionHands: event.target.checked })}
            className="accent-[var(--poker-gold)]"
          />
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <Target className="w-3.5 h-3.5" strokeWidth={1.5} />
            Repartir más manos de tu rango
          </span>
        </label>
        {settings.actionHands && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={settings.actionHandsPercent}
                onChange={event => updateSettings({ actionHandsPercent: Number(event.target.value) })}
                className="flex-1 accent-[var(--poker-gold)]"
                aria-label="Porcentaje de manos dentro del rango"
              />
              <span className="w-10 text-right text-xs font-bold tabular-nums text-[var(--poker-gold)]">
                {settings.actionHandsPercent}%
              </span>
            </div>
          </div>
        )}
        <p className="text-mini text-[var(--text-muted)] leading-snug">
          {settings.actionHands
            ? `${settings.actionHandsPercent}% de tus manos entran en el rango de tu posición y ${100 - settings.actionHandsPercent}% no. Se aplica desde la próxima mano.`
            : 'Reparto real: desde UTG solo ~1 de cada 6 manos entra en rango.'}
        </p>
      </Field>

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.guided || drill.guided === true}
          disabled={drill.guided === true}
          onChange={event => updateSettings({ guided: event.target.checked })}
          className="mt-0.5 accent-[var(--poker-gold)]"
        />
        <span className="text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" strokeWidth={1.5} />
            Preguntas guiadas antes de actuar
          </span>
          {drill.guided && (
            <span className="block text-mini text-[var(--text-muted)]">
              Siempre activas en «{drill.title}».
            </span>
          )}
        </span>
      </label>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.trainingMode}
          onChange={event => updateSettings({ trainingMode: event.target.checked })}
          className="accent-[var(--poker-gold)]"
        />
        <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <GraduationCap className="w-3.5 h-3.5" strokeWidth={1.5} />
          Modo entrenamiento
        </span>
      </label>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.autoDeal}
          onChange={event => updateSettings({ autoDeal: event.target.checked })}
          className="accent-[var(--poker-gold)]"
        />
        <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <Gauge className="w-3.5 h-3.5" strokeWidth={1.5} />
          Repartir automáticamente
        </span>
      </label>
    </div>
  )

  return (
    <AcademyPage
      title="Mesa de práctica"
      subtitle={`${settings.seats} jugadores · ciegas ${settings.smallBlind}/${settings.bigBlind} · mano #${state.handNumber}`}
      fill
      actions={
        <button
          type="button"
          onClick={game.restart}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition"
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
          Reiniciar mesa
        </button>
      }
    >
      {/* Escenario + panel (clases .play-* en index.css). Con ancho de sobra,
          dos columnas que ocupan justo el alto disponible: la mesa se encoge
          para que las acciones queden siempre a la vista y el panel lateral
          hace scroll por su cuenta. Con poco ancho (móvil, o menús laterales
          abiertos) el escenario mide una pantalla y el panel queda debajo.
          Se decide por el ancho real del hueco, no por el de la ventana.
          El scope aplica el estilo de mesa elegido. */}
      {demo && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--poker-gold)]/40 bg-[var(--poker-gold)]/10 px-4 py-2 text-sm text-[var(--text-secondary)]">
          <span>
            <b className="text-[var(--poker-gold)]">Modo gratis:</b> la mesa es solo de muestra. Suscríbete para jugar.
          </span>
          <button
            type="button"
            onClick={() => setFreeNotice(true)}
            className="rounded-lg px-3 py-1 text-xs font-bold text-[#1a1206]"
            style={{ background: 'var(--poker-gold)' }}
          >
            Desbloquear
          </button>
        </div>
      )}
      <TableThemeScope className="play-shell flex-1 min-h-0">
      {/* En modo gratis la captura corta cualquier clic antes de que llegue. */}
      <div className="contents" onClickCapture={demo ? interceptDemo : undefined}>
      <div className="play-grid">
        {/* ── Escenario: mesa, línea de estado y acciones ── */}
        <div className="play-stage">
          <div className="min-h-0 flex-1">
            <PokerTable
              state={state}
              heroId={HERO_ID}
              timeLeft={game.turnProgress}
              revealAll={false}
              heroDelta={game.heroDelta}
              fit
              settings={{ title: 'Partida', content: practiceSettings }}
            />
          </div>

          {/* Línea de estado: tu stack, lo que acaba de pasar y el bote. */}
          <div className="flex shrink-0 items-center gap-2 px-1 pb-2">
            <div className="flex shrink-0 items-baseline gap-1.5">
              <span className="text-caption uppercase tracking-wide text-[var(--text-muted)]">Stack</span>
              <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                {formatChips(hero?.stack ?? 0)}
              </span>
              {game.heroDelta !== null && game.heroDelta !== 0 && (
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    game.heroDelta > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {game.heroDelta > 0 ? '+' : ''}
                  {formatChips(game.heroDelta)}
                </span>
              )}
            </div>
            <TableFeed events={game.events} className="min-w-0 flex-1" />
            <span className="shrink-0 text-caption tabular-nums text-[var(--text-muted)]">
              Bote {formatChips(totalPot(state))}
            </span>
            {guided.enabled && (
              <button
                type="button"
                onClick={guided.open}
                disabled={!guided.spot}
                title="Preguntas guiadas: piensa antes de actuar"
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-40"
              >
                <Brain className="h-4 w-4" strokeWidth={2} />
                <span className="hidden sm:inline">Piensa</span>
              </button>
            )}
            {/* Tabla de rangos de tu posición, a un clic de las acciones. */}
            <button
              type="button"
              onClick={() => setRangesOpen(true)}
              title="Ver la tabla de rangos de tu posición"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--poker-gold)]/40 bg-[var(--poker-gold)]/10 px-2.5 py-1.5 text-xs font-semibold text-[var(--poker-gold)] transition hover:bg-[var(--poker-gold)]/20"
            >
              <Grid3x3 className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">Rango</span>
              {heroPosition && <span className="tabular-nums">{heroPosition}</span>}
            </button>
          </div>

          {/* ── Zona de acción (altura reservada para que nada salte entre manos).
              En móvil queda pegada abajo aunque se haga scroll hacia el panel. ── */}
          <div className="play-actions min-h-[7.5rem] sm:min-h-[6.5rem]">
            {game.busted ? (
              <div className="flex h-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Te has quedado sin fichas.
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Es parte del entrenamiento: revisa el historial y vuelve a empezar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={game.restart}
                  className="inline-flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black"
                  style={{ background: 'var(--poker-gold)' }}
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={2} />
                  Nueva sesión
                </button>
              </div>
            ) : game.handOver ? (
              <div className="flex h-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {(hero?.won ?? 0) > 0
                      ? `Ganaste ${formatChips(hero?.won ?? 0)}`
                      : 'Mano terminada'}
                  </p>
                  <p className="text-caption text-[var(--text-muted)]">
                    {settings.autoDeal
                      ? 'La siguiente mano se reparte sola…'
                      : 'Reparte cuando quieras.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={game.dealNext}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-black shrink-0"
                  style={{ background: 'var(--poker-gold)' }}
                >
                  <Play className="w-3.5 h-3.5" fill="currentColor" strokeWidth={0} />
                  Siguiente mano
                </button>
              </div>
            ) : (
              <ActionBar
                legal={game.legal}
                pot={totalPot(state)}
                currentBet={state.currentBet}
                bigBlind={settings.bigBlind}
                // En demo los botones quedan activos para que el clic abra el aviso.
                disabled={demo ? false : !game.isHeroTurn || guided.isOpen}
                onAction={demo ? () => setFreeNotice(true) : game.act}
              />
            )}
          </div>
        </div>

        {/* ── Panel lateral: en escritorio, scroll propio dentro de su columna ── */}
        <aside className="play-aside space-y-3 sm:space-y-4 scrollbar-thin">
          {/* El orden de acción, en fila: la posición se entiende viéndola. */}
          <PositionStrip state={state} heroId={HERO_ID} />

          {/* Qué entrenas y quién te corrige */}
          <TrainerBox
            drillId={settings.drillId}
            session={game.session}
            correctionMode={settings.correctionMode}
            aiReady={aiReady}
            aiHint={aiHint}
            onDrillChange={game.setDrill}
            onCorrectionChange={mode => updateSettings({ correctionMode: mode })}
            onReset={game.resetSession}
          />

          {/* Corrección de la última decisión */}
          <CoachPanel feedback={game.feedback} enabled={coachEnabled} />

          {/* Rivales en mesa */}
          <OpponentsPanel
            state={state}
            aiActive={game.aiActive}
            aiStatus={aiStatus}
            note={game.opponentNote}
          />

          {/* Historial de la mano */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 h-56">
            <HandLog state={state} className="h-full" />
          </section>
        </aside>
      </div>
      </div>
      </TableThemeScope>

      <FreeModeModal isOpen={freeNotice} onClose={() => setFreeNotice(false)} />

      {guided.spot && (
        <GuidedCoachModal
          spot={guided.spot}
          isOpen={guided.isOpen}
          onClose={guided.close}
          onAnswer={guided.answer}
          heroCards={hero?.holeCards ?? []}
          board={state.board}
          stats={guided.stats}
        />
      )}

      <RangeChartModal
        isOpen={rangesOpen}
        onClose={() => setRangesOpen(false)}
        heroPosition={heroPosition}
        heroHand={heroHand}
      />
    </AcademyPage>
  )
}
