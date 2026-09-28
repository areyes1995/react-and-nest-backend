// ──────────────────────────────────────────────
// RangeChartModal — la tabla de rangos sin salir
// de la mesa. Abre en la posición del estudiante,
// con su mano marcada, y deja ver las demás. Son
// los mismos rangos con los que corrige el coach:
// una mano cuenta como "de open" desde el 50%.
// ──────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import Modal from '@components/ui/modal/Modal'
import { OPENING_RANGES, parseRange, rangeCombos } from '@features/tools/ranges'
import {
  BB_DEFENSE_SPECS,
  OPEN_THRESHOLD,
  expandRange,
  type OpenerGroup,
} from '@features/table/preflopRanges'
import RangeGrid, { rangeCellColor, type RangeCell } from './RangeGrid'

type TabId = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB'

const TABS: { id: TabId; toolId?: string }[] = [
  { id: 'UTG', toolId: 'utg' },
  { id: 'HJ', toolId: 'mp' },
  { id: 'CO', toolId: 'co' },
  { id: 'BTN', toolId: 'btn' },
  { id: 'SB', toolId: 'sb' },
  { id: 'BB' },
]

const OPENERS: { id: OpenerGroup; label: string }[] = [
  { id: 'EP', label: 'UTG' },
  { id: 'HJ', label: 'HJ' },
  { id: 'CO', label: 'CO' },
  { id: 'BTN', label: 'BTN' },
  { id: 'SB', label: 'SB' },
]

/** Pestaña que corresponde a una posición del motor (MP de 9-max juega como UTG). */
function tabFor(position: string | null): TabId {
  if (position === 'MP') return 'UTG'
  return TABS.some(tab => tab.id === position) ? (position as TabId) : 'BTN'
}

export interface RangeChartModalProps {
  isOpen: boolean
  onClose: () => void
  /** Posición del estudiante en la mano actual (etiqueta del motor). */
  heroPosition: string | null
  /** Mano del estudiante en notación de matriz (`AKs`), si tiene cartas. */
  heroHand: string | null
}

export default function RangeChartModal({ isOpen, onClose, heroPosition, heroHand }: RangeChartModalProps) {
  const [tab, setTab] = useState<TabId>(() => tabFor(heroPosition))
  const [opener, setOpener] = useState<OpenerGroup>('CO')
  const [hover, setHover] = useState<string | null>(null)

  // Cada vez que se abre, vuelve a la posición en la que estás sentado.
  useEffect(() => {
    if (isOpen) setTab(tabFor(heroPosition))
  }, [isOpen, heroPosition])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const isBb = tab === 'BB'

  const openWeights = useMemo(() => {
    const source = OPENING_RANGES.find(item => item.id === TABS.find(t => t.id === tab)?.toolId)
    return source ? parseRange(source.range) : new Map<string, number>()
  }, [tab])

  const bbRanges = useMemo(() => {
    const spec = BB_DEFENSE_SPECS[opener]
    return { defend: expandRange(spec.defend), threeBet: expandRange(spec.threeBet) }
  }, [opener])

  const cellFor = (hand: string): RangeCell => {
    if (!isBb) return { weight: openWeights.get(hand) ?? 0 }
    if (bbRanges.threeBet.has(hand)) return { weight: 100, tone: 'raise' }
    if (bbRanges.defend.has(hand)) return { weight: 100, tone: 'call' }
    return { weight: 0 }
  }

  /** Qué hacer con una mano en la pestaña actual, en palabras. */
  const verdict = (hand: string): { text: string; tone: string } => {
    if (isBb) {
      if (bbRanges.threeBet.has(hand)) return { text: '3-bet', tone: 'var(--poker-gold)' }
      if (bbRanges.defend.has(hand)) return { text: 'Pagar', tone: '#38bdf8' }
      return { text: 'Retirarse', tone: 'var(--text-muted)' }
    }
    const weight = openWeights.get(hand) ?? 0
    if (weight >= 100) return { text: 'Abrir siempre', tone: 'var(--poker-gold)' }
    if (weight >= OPEN_THRESHOLD) return { text: `Abrir (${weight}%)`, tone: 'var(--poker-gold)' }
    if (weight > 0) return { text: `Mezcla: abrir ${weight}%, casi siempre fold`, tone: 'var(--text-secondary)' }
    return { text: 'Retirarse', tone: 'var(--text-muted)' }
  }

  const percent = isBb
    ? [...bbRanges.defend].reduce((sum, hand) => sum + (hand.length === 2 ? 6 : hand.endsWith('s') ? 4 : 12), 0) / 13.26
    : rangeCombos(openWeights) / 13.26

  const inHeroSpot = tab === tabFor(heroPosition)
  // Tu mano solo tiene veredicto en tu posición; en las demás, la del cursor.
  const focus = hover ?? (inHeroSpot ? heroHand : null)
  const focusVerdict = focus ? verdict(focus) : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl" maxHeight="max-h-[96dvh]">
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg-panel)] px-4 py-2.5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Rangos preflop</h2>
          <p className="truncate text-xs text-[var(--text-muted)]">
            {isBb
              ? 'Defensa de la ciega grande contra un open'
              : 'Open raise (primero en entrar) · 6-max, 100bb'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3 p-3 sm:p-4">
        {/* Posiciones */}
        <div className="grid grid-cols-6 gap-1">
          {TABS.map(item => {
            const isHero = item.id === tabFor(heroPosition)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-pressed={tab === item.id}
                className={`relative rounded-lg py-2 text-sm font-bold transition ${
                  tab === item.id
                    ? 'bg-[var(--poker-gold)] text-black'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {item.id}
                {isHero && (
                  <span className="absolute -top-1.5 right-0.5 rounded-full bg-emerald-500 px-1.5 text-[0.5625rem] font-bold leading-4 text-white">
                    Tú
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* En la BB el rango depende de quién abrió */}
        {isBb && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[var(--text-muted)]">Abre:</span>
            {OPENERS.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setOpener(item.id)}
                aria-pressed={opener === item.id}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  opener === item.id
                    ? 'bg-[var(--text-primary)] text-[var(--bg-main)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Matriz: cabe en el alto de la pantalla sin scroll */}
        <div className="mx-auto" style={{ width: 'min(100%, calc(96dvh - 17rem))' }}>
          <RangeGrid
            cellFor={cellFor}
            selected={hover}
            mine={inHeroSpot ? heroHand : null}
            onSelect={setHover}
            outLabel={isBb ? 'retirarse' : 'no se abre'}
          />
        </div>

        {/* Leyenda + mano bajo el cursor (o la tuya) */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
            {isBb ? (
              <>
                <Swatch color={rangeCellColor(100, 'raise')} label="3-bet" />
                <Swatch color={rangeCellColor(100, 'call')} label="Pagar" />
              </>
            ) : (
              <>
                <Swatch color={rangeCellColor(100)} label="100%" />
                <Swatch color={rangeCellColor(50)} label="50%" />
                <Swatch color={rangeCellColor(25)} label="25%" />
              </>
            )}
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm ring-2 ring-emerald-400" />
              Tu mano
            </span>
            <span className="tabular-nums text-[var(--text-muted)]">{percent.toFixed(1)}% de las manos</span>
          </div>

          {focus && focusVerdict && (
            <p className="text-sm">
              <span className="font-mono font-bold text-[var(--text-primary)]">{focus}</span>
              {!hover && <span className="text-[var(--text-muted)]"> (tu mano)</span>}
              <span className="text-[var(--text-muted)]"> · </span>
              <strong style={{ color: focusVerdict.tone }}>{focusVerdict.text}</strong>
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  )
}
