// ──────────────────────────────────────────────
// EquityPage — calculadora de equity.
// Funciona como Equilab: cada posición de la mesa
// (2 a 9 jugadores, 6 por defecto) tiene sus cartas
// o una mano aleatoria. Con «Abrir mesa» se juega
// la mano calle a calle: los rivales se ven boca
// abajo salvo que se marquen visibles, y lo que no
// se haya elegido se reparte al azar al avanzar.
//
// Usa el mismo Monte Carlo que los bots, así que el
// número coincide con el que la plataforma usa para
// juzgar tus decisiones en la mesa.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  LogIn,
  Minus,
  Plus,
  RotateCcw,
  Shuffle,
  Sparkles,
  Table2,
  X,
} from 'lucide-react'
import {
  createRng,
  describeHand,
  evaluate,
  evaluateScore,
  type Card,
  type EquityResult,
} from '@poker/engine'
import { AcademyPage } from '@components/layout'
import Modal from '@components/ui/modal/Modal'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { EquityCancelled, computeEquity } from '@features/tools/equityWorkerClient'
import {
  BOARD_COUNT,
  MAX_SEATS,
  MIN_SEATS,
  STREETS,
  STREET_LABELS,
  addSeat,
  buttonFirst,
  createSeats,
  dealMissing,
  missingFor,
  positionLabels,
  removeSeat,
  streetForBoard,
  type EquityStreet,
  type SeatState,
} from '@features/tools/equityTable'
import CardPicker from './equity/CardPicker'
import CardSlot from './equity/CardSlot'
import EquityTableView from './equity/EquityTableView'
import SeatList, { activateOnKey } from './equity/SeatList'
import type { PickTarget, SeatInfo } from './equity/types'

/** El héroe empieza en el botón de la mesa de 6. */
const DEFAULT_HERO_ID = 3

const BOARD_HINTS = ['Flop', 'Flop', 'Flop', 'Turn', 'River']

function laterStreet(a: EquityStreet, b: EquityStreet): EquityStreet {
  return STREETS.indexOf(a) >= STREETS.indexOf(b) ? a : b
}

export default function EquityPage() {
  // Por defecto solo juegas tú (en el BTN); los rivales empiezan retirados.
  const [seats, setSeats] = useState<SeatState[]>(() =>
    createSeats().map(seat => ({ ...seat, folded: seat.id !== DEFAULT_HERO_ID })),
  )
  const [heroId, setHeroId] = useState(DEFAULT_HERO_ID)
  const [board, setBoard] = useState<Card[]>([])
  const [street, setStreet] = useState<EquityStreet>('preflop')
  const [target, setTarget] = useState<PickTarget>({ kind: 'seat', id: DEFAULT_HERO_ID })
  const [tableOpen, setTableOpen] = useState(false)
  // Móvil (o pantalla muy baja): la baraja no cabe bajo la lista, así que
  // se abre en un modal al tocar una posición o el board.
  const compact = useMediaQuery('(max-width: 767px), (max-height: 520px)')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [randomFill, setRandomFill] = useState(true)
  const [revealAll, setRevealAll] = useState(false)
  const [results, setResults] = useState<Map<number, EquityResult> | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const labels = positionLabels(seats.length)
  const labelOf = useCallback(
    (id: number) => labels[seats.findIndex(seat => seat.id === id)] ?? '',
    [labels, seats],
  )

  /** En la mesa, ¿se ven las cartas de este asiento? */
  const isShown = useCallback(
    (seat: SeatState) =>
      seat.id === heroId || seat.visible || revealAll || street === 'showdown',
    [heroId, revealAll, street],
  )

  // ── Equity: se recalcula sola con cada cambio ──
  useEffect(() => {
    const participants = seats.filter(seat => !seat.folded)
    // En la mesa, las manos ocultas son desconocidas para el héroe.
    const hands = participants.map(seat => (!tableOpen || isShown(seat) ? seat.cards : []))
    if (participants.length < 2 || hands.every(hand => hand.length === 0)) {
      setResults(null)
      setCalculating(false)
      return
    }

    // Mientras llega el cálculo nuevo, los números viejos se ven atenuados.
    setCalculating(true)
    let active = true
    // Un pequeño margen agrupa los cambios seguidos (p.ej. varios clics).
    const timer = window.setTimeout(() => {
      computeEquity(
        hands.map(hand => [...hand]),
        board.slice(0, BOARD_COUNT[street]),
        // Monte Carlo solo cuando no se puede enumerar (preflop o manos
        // aleatorias); con semilla fija, así el resultado no cambia al repetir.
        // Presupuesto fijo de ~60.000 manos evaluadas: más muestras con pocos
        // jugadores, menos con la mesa llena.
        Math.round(60000 / participants.length),
      )
        .then(outcome => {
          if (!active) return
          setResults(new Map(participants.map((seat, index) => [seat.id, outcome[index]])))
          setCalculating(false)
        })
        .catch(error => {
          if (!active || error instanceof EquityCancelled) return
          setResults(null)
          setCalculating(false)
        })
    }, 40)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [seats, board, street, tableOpen, isShown, nonce])

  // ── Jugadas y ganadores con el board a la vista ──
  const seatInfos: SeatInfo[] = useMemo(() => {
    const visibleBoard = board.slice(0, BOARD_COUNT[street])
    const full = visibleBoard.length === 5
    const scores = new Map<number, number>()
    if (full) {
      for (const seat of seats) {
        if (!seat.folded && seat.cards.length === 2) {
          scores.set(seat.id, evaluateScore([...seat.cards, ...visibleBoard]))
        }
      }
    }
    const allKnown = seats.every(seat => seat.folded || seat.cards.length === 2)
    const best = scores.size > 0 ? Math.max(...scores.values()) : null

    return seats.map((seat, index) => {
      const shown = !tableOpen || isShown(seat)
      const handName =
        !seat.folded && seat.cards.length === 2 && visibleBoard.length >= 3 && shown
          ? describeHand(evaluate([...seat.cards, ...visibleBoard]))
          : undefined
      return {
        seat,
        label: labels[index],
        isHero: seat.id === heroId,
        shown,
        result: results?.get(seat.id),
        winner: street === 'showdown' && allKnown && best !== null && scores.get(seat.id) === best,
        handName,
      }
    })
  }, [seats, board, street, labels, heroId, results, tableOpen, isShown])

  const owners = useMemo(() => {
    const map = new Map<Card, string>()
    seats.forEach((seat, index) => seat.cards.forEach(card => map.set(card, labels[index])))
    board.forEach(card => map.set(card, 'Mesa'))
    return map
  }, [seats, board, labels])

  const targetLabel =
    target.kind === 'board'
      ? 'la mesa (board)'
      : target.id === heroId
        ? `tu mano (${labelOf(target.id)})`
        : labelOf(target.id)

  // ── Cartas ──
  const removeCard = (card: Card) => {
    setSeats(current => current.map(seat =>
      seat.cards.includes(card) ? { ...seat, cards: seat.cards.filter(c => c !== card) } : seat,
    ))
    if (board.includes(card)) {
      const nextBoard = board.filter(c => c !== card)
      setBoard(nextBoard)
      if (BOARD_COUNT[street] > nextBoard.length) setStreet(streetForBoard(nextBoard.length))
    }
    setNotice(null)
  }

  /** Siguiente asiento sin cartas tras `id`; si no queda ninguno, el board. */
  const nextTarget = (current: SeatState[], id: number): PickTarget => {
    const start = current.findIndex(seat => seat.id === id)
    for (let step = 1; step < current.length; step++) {
      const seat = current[(start + step) % current.length]
      if (!seat.folded && seat.cards.length < 2) return { kind: 'seat', id: seat.id }
    }
    return { kind: 'board' }
  }

  const pick = (card: Card) => {
    if (owners.has(card)) {
      removeCard(card)
      return
    }
    setNotice(null)

    if (target.kind === 'board') {
      if (board.length >= 5) {
        setNotice('La mesa ya tiene cinco cartas. Toca una para quitarla.')
        return
      }
      const nextBoard = [...board, card]
      setBoard(nextBoard)
      setStreet(current => laterStreet(current, streetForBoard(nextBoard.length)))
      if (nextBoard.length === 5) setPickerOpen(false)
      return
    }

    const seat = seats.find(item => item.id === target.id)
    if (!seat) return
    if (seat.cards.length >= 2) {
      setNotice(`${labelOf(seat.id)} ya tiene dos cartas. Toca una para quitarla.`)
      return
    }
    const nextSeats = seats.map(item =>
      item.id === seat.id ? { ...item, folded: false, cards: [...item.cards, card] } : item,
    )
    setSeats(nextSeats)
    if (seat.cards.length + 1 === 2) {
      // En el modal, completar la mano lo cierra; en escritorio se pasa
      // directamente al siguiente asiento sin cartas.
      if (compact && pickerOpen) setPickerOpen(false)
      else setTarget(nextTarget(nextSeats, seat.id))
    }
  }

  // ── Calles ──
  const goTo = (to: EquityStreet) => {
    setNotice(null)
    if (STREETS.indexOf(to) <= STREETS.indexOf(street)) {
      setStreet(to)
      return
    }
    if (randomFill) {
      // Lo que falte (manos y board) sale al azar; lo elegido se respeta.
      const dealt = dealMissing(seats, board, to, createRng())
      setSeats(dealt.seats)
      setBoard(dealt.board)
    } else if (missingFor(seats, board, to)) {
      setNotice(
        to === 'showdown'
          ? 'Para el showdown todos los jugadores en la mano necesitan cartas. Elígelas o activa «Aleatorio».'
          : `Faltan cartas para el ${STREET_LABELS[to].toLowerCase()}. Elígelas en la mesa o activa «Aleatorio».`,
      )
      if (board.length < BOARD_COUNT[to]) setTarget({ kind: 'board' })
      return
    }
    setStreet(to)
  }

  const streetIndex = STREETS.indexOf(street)

  // ── Acciones generales ──
  const calculate = () => {
    setNotice(null)
    if (randomFill) {
      const dealt = dealMissing(seats, board, street, createRng())
      setSeats(dealt.seats)
      setBoard(dealt.board)
    }
    setNonce(value => value + 1)
  }

  const clearCards = (current: SeatState[]) => current.map(seat => ({ ...seat, cards: [] }))

  const randomHand = () => {
    const dealt = dealMissing(clearCards(seats), [], 'preflop', createRng())
    setSeats(dealt.seats)
    setBoard([])
    setStreet('preflop')
    setNotice(null)
  }

  const reset = () => {
    setSeats(clearCards(seats))
    setBoard([])
    setStreet('preflop')
    setTarget({ kind: 'seat', id: heroId })
    setNotice(null)
  }

  const changeSeats = (delta: 1 | -1) => {
    const next = delta > 0 ? addSeat(seats, true) : removeSeat(seats, heroId)
    setSeats(next)
    if (target.kind === 'seat' && !next.some(seat => seat.id === target.id)) {
      setTarget({ kind: 'seat', id: heroId })
    }
  }

  const selectTarget = (next: PickTarget) => {
    setTarget(next)
    setNotice(null)
    if (compact) setPickerOpen(true)
  }

  const updateSeat = (id: number, change: (seat: SeatState) => SeatState) =>
    setSeats(current => current.map(seat => (seat.id === id ? change(seat) : seat)))

  const seatActions = {
    onSelect: (id: number) => selectTarget({ kind: 'seat', id }),
    onRemoveCard: removeCard,
    onToggleVisible: (id: number) => updateSeat(id, seat => ({ ...seat, visible: !seat.visible })),
    onToggleFolded: (id: number) => updateSeat(id, seat => ({ ...seat, folded: !seat.folded })),
    onSetHero: (id: number) => {
      setHeroId(id)
      setTarget({ kind: 'seat', id })
    },
  }

  const hero = seatInfos.find(info => info.isHero)
  const rivals = seats.filter(seat => !seat.folded && seat.id !== heroId).length
  // En la mesa, rivales cuya mano no ves: tu equity se mide contra lo desconocido.
  const hiddenRivals = tableOpen
    ? seats.filter(seat => !seat.folded && seat.id !== heroId && !isShown(seat)).length
    : 0

  // Esc cierra el modal abierto (mesa o baraja).
  useEffect(() => {
    if (!tableOpen && !pickerOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setTableOpen(false)
      setPickerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tableOpen, pickerOpen])

  const streetBar = (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]/40 p-2">
      <button
        type="button"
        disabled={streetIndex === 0}
        onClick={() => goTo(STREETS[streetIndex - 1])}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver
      </button>

      <ol className="flex flex-1 flex-wrap justify-center gap-1">
        {STREETS.map((item, index) => (
          <li key={item}>
            <button
              type="button"
              onClick={() => goTo(item)}
              aria-current={item === street ? 'step' : undefined}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                item === street
                  ? 'bg-[var(--poker-gold)] text-black'
                  : index < streetIndex
                    ? 'bg-[var(--poker-gold)]/15 text-[var(--poker-gold)] hover:bg-[var(--poker-gold)]/25'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              {STREET_LABELS[item]}
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        disabled={streetIndex === STREETS.length - 1}
        onClick={() => goTo(STREETS[streetIndex + 1])}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-black disabled:opacity-40 disabled:cursor-not-allowed transition"
        style={{ background: 'var(--poker-gold)' }}
      >
        Siguiente
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )

  const noticeBox = notice && (
    <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
      {notice}
    </p>
  )

  const randomSwitch = (
    <Switch
      checked={randomFill}
      onChange={setRandomFill}
      label="Aleatorio"
      description="Lo que no hayas elegido (manos y board) se reparte al azar al calcular o avanzar de calle."
    />
  )

  return (
    <AcademyPage
      title="Calculadora de equity"
      subtitle="Elige posiciones y cartas como en Equilab, o abre la mesa y juega la mano calle a calle"
      actions={
        <button
          type="button"
          onClick={() => setTableOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-black transition hover:brightness-110"
          style={{ background: 'var(--poker-gold)' }}
        >
          <Table2 className="h-4 w-4" />
          Abrir mesa
        </button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-3">
          {compact && (
            <p className="text-sm text-[var(--text-secondary)]">
              Toca una posición o el board para elegir sus cartas.
            </p>
          )}
          <SeatList
            seats={buttonFirst(seatInfos)}
            activeId={target.kind === 'seat' ? target.id : null}
            calculating={calculating}
            {...seatActions}
          />

          {/* ── Board (cartas comunitarias) ── */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => selectTarget({ kind: 'board' })}
            onKeyDown={event => activateOnKey(event, () => selectTarget({ kind: 'board' }))}
            className={`flex flex-wrap items-center gap-3 rounded-xl border px-2.5 py-1.5 cursor-pointer transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--poker-gold)] ${
              target.kind === 'board'
                ? 'border-[var(--poker-gold)] bg-[var(--poker-gold)]/[0.07]'
                : 'border-[var(--border)] bg-[var(--bg-panel)] hover:border-[var(--border-active)]'
            }`}
          >
            <div className="w-12 shrink-0 leading-tight">
              <p className="text-sm font-bold text-[var(--text-primary)]">Board</p>
              <span className="text-xs text-[var(--text-muted)]">{STREET_LABELS[street]}</span>
            </div>
            <div className="flex gap-1">
              {BOARD_HINTS.map((hint, index) => (
                <span key={index} className={index >= 3 ? 'ml-1.5' : ''}>
                  <CardSlot
                    card={board[index]}
                    size="sm"
                    hint={hint}
                    highlight={target.kind === 'board' && index === board.length}
                    pending={index >= BOARD_COUNT[street]}
                    onRemove={removeCard}
                  />
                </span>
              ))}
            </div>
            {board.length > BOARD_COUNT[street] && (
              <p className="text-xs text-[var(--text-muted)]">Las atenuadas aún no han salido en esta calle.</p>
            )}
          </div>

          {!tableOpen && !(compact && pickerOpen) && noticeBox}

          {!compact && <CardPicker owners={owners} targetLabel={targetLabel} onPick={pick} />}
        </div>

        {/* ── Panel lateral ── */}
        <aside className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 xl:content-start">
          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Jugadores</span>
              <div className="flex items-center gap-2">
                <StepButton label="Quitar jugador" disabled={seats.length <= MIN_SEATS} onClick={() => changeSeats(-1)}>
                  <Minus className="h-4 w-4" />
                </StepButton>
                <span className="w-6 text-center text-lg font-bold tabular-nums text-[var(--text-primary)]">
                  {seats.length}
                </span>
                <StepButton label="Añadir jugador" disabled={seats.length >= MAX_SEATS} onClick={() => changeSeats(1)}>
                  <Plus className="h-4 w-4" />
                </StepButton>
              </div>
            </div>

            {randomSwitch}

            <div className="grid gap-2">
              <button
                type="button"
                onClick={calculate}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
                style={{ background: 'var(--poker-gold)' }}
              >
                <Sparkles className="h-4 w-4" />
                {randomFill ? 'Repartir y calcular' : 'Calcular'}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <SecondaryButton onClick={randomHand} icon={<Shuffle className="h-4 w-4" />}>
                  Mano nueva
                </SecondaryButton>
                <SecondaryButton onClick={reset} icon={<RotateCcw className="h-4 w-4" />}>
                  Limpiar
                </SecondaryButton>
              </div>
            </div>
          </section>

          <HeroSummary hero={hero} rivals={rivals} hiddenRivals={0} calculating={calculating} randomFill={randomFill} />
        </aside>
      </div>

      {/* ── Baraja en modal (móvil) ── */}
      <Modal
        isOpen={compact && pickerOpen && !tableOpen}
        onClose={() => setPickerOpen(false)}
        maxWidth="max-w-md"
        maxHeight="max-h-[94dvh]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg-panel)] px-4 py-3">
          <h2 className="min-w-0 truncate text-base font-semibold text-[var(--text-primary)]">
            Cartas de <span className="text-[var(--poker-gold)]">{targetLabel}</span>
          </h2>
          <button
            type="button"
            onClick={() => setPickerOpen(false)}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          {/* Lo elegido hasta ahora: tocar una carta la quita. */}
          <div className="flex min-h-[4.375rem] items-center justify-center gap-1.5">
            {target.kind === 'board'
              ? BOARD_HINTS.map((hint, index) => (
                  <span key={index} className={index >= 3 ? 'ml-1' : ''}>
                    <CardSlot
                      card={board[index]}
                      size="sm"
                      hint={hint}
                      highlight={index === board.length}
                      onRemove={removeCard}
                    />
                  </span>
                ))
              : [0, 1].map(index => {
                  const cards = seats.find(seat => seat.id === target.id)?.cards ?? []
                  return (
                    <CardSlot
                      key={index}
                      card={cards[index]}
                      highlight={index === cards.length}
                      onRemove={removeCard}
                    />
                  )
                })}
          </div>

          {noticeBox}

          <CardPicker owners={owners} onPick={pick} compact />

          <button
            type="button"
            onClick={() => setPickerOpen(false)}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-black"
            style={{ background: 'var(--poker-gold)' }}
          >
            Listo
          </button>
        </div>
      </Modal>

      {/* ── Mesa en vivo ── */}
      <Modal isOpen={tableOpen} onClose={() => setTableOpen(false)} maxWidth="max-w-6xl" maxHeight="max-h-[96dvh]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-2.5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Mesa en vivo</h2>
            <p className="truncate text-xs text-[var(--text-muted)]">
              Recorre las calles; los rivales se ven boca abajo salvo los marcados con el ojo o en el showdown.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTableOpen(false)}
            aria-label="Cerrar mesa"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="min-w-0 space-y-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-main)]">
              <EquityTableView
                seats={seatInfos}
                board={board}
                street={street}
                calculating={calculating}
                hiddenRivals={hiddenRivals}
              />
            </div>
            {streetBar}
            {noticeBox}
          </div>

          <div className="space-y-3">
            <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-3.5 space-y-3">
              {randomSwitch}
              <Switch
                checked={revealAll}
                onChange={setRevealAll}
                label="Mostrar todas las cartas"
                description="Destapa a todos los rivales sin esperar al showdown."
                icon={<Eye className="h-4 w-4" />}
              />
              <SecondaryButton onClick={randomHand} icon={<Shuffle className="h-4 w-4" />}>
                Mano nueva
              </SecondaryButton>
            </section>
            <HeroSummary hero={hero} rivals={rivals} hiddenRivals={hiddenRivals} calculating={calculating} randomFill={randomFill} />
          </div>
        </div>
      </Modal>
    </AcademyPage>
  )
}

function HeroSummary({
  hero,
  rivals,
  hiddenRivals,
  calculating,
  randomFill,
}: {
  hero?: SeatInfo
  rivals: number
  hiddenRivals: number
  calculating: boolean
  randomFill: boolean
}) {
  const result = hero?.result
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Tu equity {hero && <span className="text-[var(--text-muted)]">· {hero.label}</span>}
        </h2>
        {calculating && <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />}
      </div>

      {result && !hero?.seat.folded ? (
        <div className={`space-y-2.5 transition-opacity ${calculating ? 'opacity-40' : ''}`}>
          <p className="text-center text-4xl font-extrabold tabular-nums text-[var(--poker-gold)]">
            {(result.equity * 100).toFixed(1)}%
          </p>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-[var(--bg-surface)]">
            <span className="bg-emerald-500" style={{ width: `${result.win * 100}%` }} />
            <span className="bg-amber-400" style={{ width: `${result.tie * 100}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Gana" value={result.win} className="text-emerald-400" />
            <Stat label="Empata" value={result.tie} className="text-amber-400" />
            <Stat label="Pierde" value={result.lose} className="text-[var(--text-secondary)]" />
          </div>
          {hero?.handName && (
            <p className="rounded-lg bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
              Tu jugada: <strong>{hero.handName}</strong>
            </p>
          )}
          <p className="border-t border-[var(--border)] pt-2 text-center text-xs text-[var(--text-muted)]">
            {result.exact
              ? result.samples === 1
                ? 'Resultado exacto: todas las cartas son conocidas'
                : `Cálculo exacto: ${result.samples.toLocaleString('es-ES')} runouts posibles`
              : `${result.samples.toLocaleString('es-ES')} simulaciones (±${(
                  (100 * Math.sqrt((result.equity * (1 - result.equity)) / result.samples)) * 2
                ).toFixed(1)}%)`}
          </p>
          {hiddenRivals > 0 && (
            <p className="rounded-lg bg-[var(--bg-surface)] px-3 py-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              Contra {hiddenRivals === 1 ? 'una mano oculta' : `${hiddenRivals} manos ocultas`}: como no las
              ves, cuentan como manos desconocidas. Por eso puede no coincidir con la calculadora; al
              destaparlas o llegar al showdown verás la equity real.
            </p>
          )}
        </div>
      ) : rivals === 0 ? (
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Todos los rivales están retirados. Métete al menos uno en la mano con el botón{' '}
          <LogIn className="inline h-3.5 w-3.5 align-[-2px]" /> de su fila, o eligiéndole cartas.
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Elige tus cartas en la baraja o pulsa «{randomFill ? 'Repartir y calcular' : 'Calcular'}». Los
          asientos sin cartas cuentan como mano aleatoria.
        </p>
      )}
    </section>
  )
}

function SecondaryButton({ onClick, icon, children }: { onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition"
    >
      {icon}
      {children}
    </button>
  )
}

function Stat({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div>
      <p className={`text-base font-bold tabular-nums ${className}`}>{(value * 100).toFixed(1)}%</p>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  )
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  )
}

function Switch({
  checked,
  onChange,
  label,
  description,
  icon,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description: string
  icon?: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-[var(--poker-gold)]' : 'bg-[var(--bg-surface-hover)]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[1.375rem]' : 'left-0.5'
          }`}
        />
      </button>
      <span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
          {icon}
          {label}
        </span>
        <span className="block text-xs leading-relaxed text-[var(--text-muted)]">{description}</span>
      </span>
    </label>
  )
}
