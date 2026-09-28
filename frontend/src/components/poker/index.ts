// ──────────────────────────────────────────────
// poker — primitivas visuales de la mesa.
// Se reutilizan en la mesa de práctica, en las
// lecciones (ejemplos de manos) y en las
// herramientas (equity, rangos, entrenador).
// ──────────────────────────────────────────────

export { default as PlayingCard, CardRow } from './PlayingCard'
export type { PlayingCardProps, CardRowProps, CardSize } from './PlayingCard'
export { PotDisplay, DealerButton, formatChips } from './TableChips'
export { default as BetChips, chipColumns } from './BetChips'
export type { BetChipsProps, TablePoint } from './BetChips'
export { default as PlayerSeat } from './PlayerSeat'
export { default as PokerTable, TableFelt } from './PokerTable'
export { default as ActionBar } from './ActionBar'
export { default as HandLog } from './HandLog'
export { default as CoachPanel } from './CoachPanel'
export { default as TableFeed } from './TableFeed'
export { default as HandResultOverlay } from './HandResultOverlay'
export { default as OpponentsPanel } from './OpponentsPanel'
export { default as PositionBadge } from './PositionBadge'
export { default as PositionStrip } from './PositionStrip'
export { default as TrainerBox } from './TrainerBox'
export { default as TableThemePicker } from './TableThemePicker'
export { default as TableSettingsButton, TableSettingsModal } from './TableSettings'
export type { TableSettingsExtra } from './TableSettings'
export { default as RangeGrid, rangeCellColor } from './RangeGrid'
export type { RangeCell, RangeTone, RangeGridProps } from './RangeGrid'
export { default as RangeChartModal } from './RangeChartModal'
export { default as GuidedCoachModal } from './GuidedCoachModal'
