// ──────────────────────────────────────────────
// Achievements — hitos del estudiante.
// Marcan avances reales (terminar un nivel, jugar
// manos, acertar decisiones), no tiempo de
// pantalla: lo que se recompensa es lo que la gente
// repite.
// ──────────────────────────────────────────────

import type { StudentProgress } from './store'

export interface Achievement {
  id: string
  title: string
  description: string
  /** Nombre del icono de lucide-react. */
  icon: string
  /** Progreso actual hacia el hito (0..1). */
  progress: (p: StudentProgress) => number
}

const ratio = (value: number, target: number) => Math.min(1, value / target)

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-lesson',
    title: 'Primera clase',
    description: 'Completa tu primera clase de la academia.',
    icon: 'GraduationCap',
    progress: p => ratio(Object.keys(p.lessons).length, 1),
  },
  {
    id: 'ten-lessons',
    title: 'Base sólida',
    description: 'Completa 10 clases.',
    icon: 'BookOpenCheck',
    progress: p => ratio(Object.keys(p.lessons).length, 10),
  },
  {
    id: 'first-hand',
    title: 'Primera mano',
    description: 'Juega tu primera mano en la mesa de práctica.',
    icon: 'Spade',
    progress: p => ratio(p.stats.handsPlayed, 1),
  },
  {
    id: 'hundred-hands',
    title: 'Kilometraje',
    description: 'Juega 100 manos.',
    icon: 'Repeat',
    progress: p => ratio(p.stats.handsPlayed, 100),
  },
  {
    id: 'streak-7',
    title: 'Constancia',
    description: 'Mantén una racha de 7 días.',
    icon: 'Flame',
    progress: p => ratio(p.bestStreak, 7),
  },
  {
    id: 'good-decisions-50',
    title: 'Decisiones sólidas',
    description: 'Acumula 50 decisiones correctas en modo entrenamiento.',
    icon: 'Target',
    progress: p => ratio(p.stats.goodDecisions, 50),
  },
  {
    id: 'winning-session',
    title: 'Sesión ganadora',
    description: 'Termina una sesión con balance positivo de fichas.',
    icon: 'TrendingUp',
    progress: p => (p.stats.chipsNet > 0 ? 1 : 0),
  },
  {
    id: 'level-5',
    title: 'Nivel 5',
    description: 'Alcanza el nivel 5 de la academia.',
    icon: 'Award',
    progress: p => ratio(p.xp, 1000),
  },
]

/** Hitos completados en este momento. */
export function unlockedAchievements(progress: StudentProgress): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.progress(progress) >= 1)
}
