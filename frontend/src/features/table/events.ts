// ──────────────────────────────────────────────
// Eventos de la mesa — lo que hay que ver sin leer.
// Se derivan del log del motor, no de las acciones
// del jugador: así el aviso de la mesa y el historial
// cuentan lo mismo, incluidas las ciegas y el reparto
// del bote, que no son acciones de nadie.
// ──────────────────────────────────────────────

import type { LogEntry, TableState } from '@poker/engine'

export type TableEventKind =
  | 'bet'
  | 'raise'
  | 'call'
  | 'check'
  | 'fold'
  | 'blind'
  | 'win'
  | 'street'

export interface TableEvent {
  /** Identificador estable para la animación de entrada/salida. */
  id: string
  kind: TableEventKind
  /** Texto ya redactado, en segunda persona si es del estudiante. */
  text: string
  playerId?: string
  amount?: number
  /** El evento le pasa al estudiante: se resalta más. */
  isHero: boolean
  at: number
}

const KIND_BY_KEY: Record<string, TableEventKind> = {
  'poker.log.bets': 'bet',
  'poker.log.raises': 'raise',
  'poker.log.calls': 'call',
  'poker.log.checks': 'check',
  'poker.log.folds': 'fold',
  'poker.log.postsSmallBlind': 'blind',
  'poker.log.postsBigBlind': 'blind',
  'poker.log.wins': 'win',
  'poker.log.street.flop': 'street',
  'poker.log.street.turn': 'street',
  'poker.log.street.river': 'street',
  'poker.log.street.showdown': 'street',
}

/** Máximo de avisos vivos: más de esto y la mesa deja de leerse. */
const MAX_EVENTS = 5

/** Formato por defecto: fichas. La mesa pasa el suyo (fichas o BB, según el estudiante). */
const plainChips = (amount: number) => amount.toLocaleString('es-ES')

/** Redacta el evento. En segunda persona cuando le toca al estudiante. */
function describe(
  key: string,
  name: string,
  isHero: boolean,
  params: Record<string, string | number>,
  format: (amount: number) => string,
): string {
  const amount = format(Number(params.amount ?? 0))

  switch (key) {
    case 'poker.log.bets':
      return isHero ? `Apuestas ${amount}` : `${name} apuesta ${amount}`
    case 'poker.log.raises':
      return isHero ? `Subes a ${amount}` : `${name} sube a ${amount}`
    case 'poker.log.calls':
      return isHero ? `Igualas ${amount}` : `${name} iguala ${amount}`
    case 'poker.log.checks':
      return isHero ? 'Pasas' : `${name} pasa`
    case 'poker.log.folds':
      return isHero ? 'Te retiras' : `${name} se retira`
    case 'poker.log.postsSmallBlind':
      return isHero ? `Pones la ciega pequeña (${amount})` : `${name}: ciega pequeña ${amount}`
    case 'poker.log.postsBigBlind':
      return isHero ? `Pones la ciega grande (${amount})` : `${name}: ciega grande ${amount}`
    case 'poker.log.wins':
      return isHero ? `¡Ganas ${amount}!` : `${name} gana ${amount}`
    case 'poker.log.street.flop':
      return 'Flop'
    case 'poker.log.street.turn':
      return 'Turn'
    case 'poker.log.street.river':
      return 'River'
    case 'poker.log.street.showdown':
      return 'Showdown'
    default:
      return ''
  }
}

/**
 * Añade los eventos derivados de las entradas nuevas del log.
 * Se ignoran las que no tienen lectura visual (el inicio de mano, por ejemplo):
 * el aviso está para lo que cambia fichas o cierra la mano.
 */
export function pushEvents(
  current: TableEvent[],
  state: TableState,
  entries: LogEntry[],
  heroId: string,
  format: (amount: number) => string = plainChips,
): TableEvent[] {
  const now = Date.now()
  const fresh: TableEvent[] = []

  entries.forEach((entry, index) => {
    const kind = KIND_BY_KEY[entry.key]
    if (!kind) return

    const player =
      entry.seat === null ? undefined : state.players.find(p => p.seat === entry.seat)
    const isHero = player?.id === heroId
    const text = describe(entry.key, player?.name ?? '', isHero, entry.params ?? {}, format)
    if (!text) return

    fresh.push({
      id: `${state.handNumber}-${state.log.length}-${index}-${entry.key}`,
      kind,
      text,
      playerId: player?.id,
      amount: Number(entry.params?.amount ?? 0) || undefined,
      isHero,
      at: now,
    })
  })

  if (fresh.length === 0) return current
  return [...current, ...fresh].slice(-MAX_EVENTS)
}

/** Estilo de cada tipo de evento: color y prioridad visual. */
export const EVENT_STYLE: Record<TableEventKind, { accent: string; emphasis: boolean }> = {
  win: { accent: 'var(--poker-gold)', emphasis: true },
  raise: { accent: '#f97316', emphasis: true },
  bet: { accent: '#f59e0b', emphasis: true },
  call: { accent: '#38bdf8', emphasis: false },
  check: { accent: '#94a3b8', emphasis: false },
  fold: { accent: '#64748b', emphasis: false },
  blind: { accent: '#a78bfa', emphasis: false },
  street: { accent: '#22c55e', emphasis: false },
}
