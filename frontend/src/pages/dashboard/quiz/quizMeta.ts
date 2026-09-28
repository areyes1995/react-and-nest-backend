// ──────────────────────────────────────────────
// Metadatos visuales del banco de preguntas.
// Van aparte del currículo a propósito: importar
// `LEVELS` arrastraría todas las clases a esta página
// solo para leer cuatro colores.
// ──────────────────────────────────────────────

import { Crown, Crosshair, Layers, Scale, Shuffle, Sprout, Swords, type LucideIcon } from 'lucide-react'
import type { LevelId } from '@features/academy/types'
import type { QuizFormat, QuizMode } from '@services/quiz'

export interface ModeMeta {
  id: QuizMode
  title: string
  subtitle: string
  color: string
  icon: LucideIcon
}

export const LEVEL_MODES: (ModeMeta & { id: LevelId })[] = [
  { id: 'beginner', title: 'Principiante', subtitle: 'Reglas, manos y posición', color: 'var(--level-beginner)', icon: Sprout },
  { id: 'intermediate', title: 'Intermedio', subtitle: 'Pot odds, proyectos y c-bets', color: 'var(--level-intermediate)', icon: Layers },
  { id: 'advanced', title: 'Avanzado', subtitle: 'Rangos, MDF y bloqueadores', color: 'var(--level-advanced)', icon: Swords },
  { id: 'theory', title: 'Teoría', subtitle: 'GTO, MDF y estrategias mixtas', color: 'var(--level-theory)', icon: Scale },
  { id: 'exploit', title: 'Explotación', subtitle: 'Population reads y contraataque', color: 'var(--level-exploit)', icon: Crosshair },
  { id: 'pro', title: 'Profesional', subtitle: 'GTO, explotación e ICM', color: 'var(--level-pro)', icon: Crown },
]

export const RANDOM_MODE: ModeMeta = {
  id: 'random',
  title: 'Aleatorio',
  subtitle: 'Todos los niveles mezclados',
  color: '#f472b6',
  icon: Shuffle,
}

export const MODES: ModeMeta[] = [...LEVEL_MODES, RANDOM_MODE]

export function modeMeta(id: QuizMode): ModeMeta {
  return MODES.find(mode => mode.id === id) ?? RANDOM_MODE
}

export const FORMAT_OPTIONS: { id: QuizFormat | 'mixed'; label: string }[] = [
  { id: 'mixed', label: 'Mixto' },
  { id: 'multiple-choice', label: 'Opción múltiple' },
  { id: 'true-false', label: 'Verdadero o falso' },
  { id: 'spot', label: 'Situación con cartas' },
]

export const COUNT_OPTIONS = [5, 10, 20]

/** Preguntas del reto del día: corto a propósito, para que siempre apetezca. */
export const DAILY_COUNT = 5

/** Color del combo según el multiplicador: se calienta a medida que sube. */
export function comboColor(multiplier: number): string {
  if (multiplier >= 3) return '#f43f5e'
  if (multiplier >= 2) return '#fb923c'
  if (multiplier >= 1.5) return '#facc15'
  return 'var(--text-muted)'
}
