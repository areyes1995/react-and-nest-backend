// ──────────────────────────────────────────────
// Progress store — el expediente del estudiante.
// Vive en localStorage mientras el backend no está
// conectado, pero la forma de los datos ya es la
// que expondrá la API (`/progress`), así que migrar
// será cambiar el origen, no los componentes.
// ──────────────────────────────────────────────

const STORAGE_KEY = 'poker_academy_progress_v1'

export interface LessonProgress {
  lessonId: string
  completedAt: string
  /** Aciertos del quiz sobre el total, si la lección tenía. */
  score?: { correct: number; total: number }
}

export interface HandRecord {
  id: string
  playedAt: string
  seed: number
  handNumber: number
  seats: number
  /** Cartas del estudiante, en notación corta. */
  hole: string[]
  board: string[]
  /** Fichas ganadas (positivo) o perdidas (negativo) en la mano. */
  net: number
  /** Mano final del estudiante, si llegó al showdown. */
  handName?: string
  won: boolean
}

export interface SessionStats {
  handsPlayed: number
  handsWon: number
  /** Manos en las que puso fichas voluntariamente (VPIP). */
  handsVoluntary: number
  goodDecisions: number
  okDecisions: number
  mistakes: number
  chipsNet: number
}

export interface StudentProgress {
  xp: number
  /** Días consecutivos con actividad. */
  streak: number
  bestStreak: number
  /** Fecha ISO (solo día) de la última actividad. */
  lastActiveDay: string | null
  lessons: Record<string, LessonProgress>
  /**
   * Marcadores de la versión anterior. Ahora viven en el backend
   * (`features/saved`); aquí solo se conservan para poder migrarlos la primera
   * vez que el estudiante entra con la versión nueva.
   */
  bookmarks: string[]
  /** Últimas manos jugadas, de más reciente a más antigua. */
  hands: HandRecord[]
  stats: SessionStats
  achievements: string[]
  /** XP ganado por día (`YYYY-MM-DD` → XP): alimenta la meta diaria y el calendario de racha. */
  dailyXp: Record<string, number>
  /** Días (`YYYY-MM-DD`) en los que ya se abrió el cofre diario. */
  chests: string[]
}

export const EMPTY_PROGRESS: StudentProgress = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDay: null,
  lessons: {},
  bookmarks: [],
  hands: [],
  stats: {
    handsPlayed: 0,
    handsWon: 0,
    handsVoluntary: 0,
    goodDecisions: 0,
    okDecisions: 0,
    mistakes: 0,
    chipsNet: 0,
  },
  achievements: [],
  dailyXp: {},
  chests: [],
}

const MAX_HANDS = 100

/**
 * Día actual en formato `YYYY-MM-DD`, para calcular la racha. En hora local:
 * con UTC, en Latinoamérica el día cambiaba a las 7-8 de la tarde y una clase
 * nocturna contaba para el día siguiente.
 */
export function today(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function daysBetween(from: string, to: string): number {
  const a = Date.parse(from + 'T00:00:00Z')
  const b = Date.parse(to + 'T00:00:00Z')
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.POSITIVE_INFINITY
  return Math.round((b - a) / 86_400_000)
}

export function readProgress(): StudentProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_PROGRESS }
    const parsed = JSON.parse(raw) as Partial<StudentProgress>
    return {
      ...EMPTY_PROGRESS,
      ...parsed,
      lessons: parsed.lessons ?? {},
      bookmarks: parsed.bookmarks ?? [],
      hands: parsed.hands ?? [],
      stats: { ...EMPTY_PROGRESS.stats, ...(parsed.stats ?? {}) },
      achievements: parsed.achievements ?? [],
      dailyXp: parsed.dailyXp ?? {},
      chests: parsed.chests ?? [],
    }
  } catch {
    return { ...EMPTY_PROGRESS }
  }
}

export function writeProgress(progress: StudentProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Cuota llena o almacenamiento bloqueado: el progreso se pierde al recargar
    // pero la sesión sigue siendo usable.
  }
}

/**
 * Registra actividad del día y actualiza la racha.
 * Mismo día → no cambia; día siguiente → +1; hueco mayor → vuelve a 1.
 */
export function touchStreak(progress: StudentProgress): StudentProgress {
  const day = today()
  if (progress.lastActiveDay === day) return progress

  const gap = progress.lastActiveDay ? daysBetween(progress.lastActiveDay, day) : Number.POSITIVE_INFINITY
  const streak = gap === 1 ? progress.streak + 1 : 1

  return {
    ...progress,
    streak,
    bestStreak: Math.max(progress.bestStreak, streak),
    lastActiveDay: day,
  }
}

/** Añade una mano al historial, recortando al máximo configurado. */
export function pushHand(progress: StudentProgress, record: HandRecord): StudentProgress {
  return { ...progress, hands: [record, ...progress.hands].slice(0, MAX_HANDS) }
}

/** Nivel del estudiante a partir del XP: 250 XP por nivel, curva plana y legible. */
export function levelFromXp(xp: number): { level: number; current: number; needed: number } {
  const perLevel = 250
  const level = Math.floor(xp / perLevel) + 1
  return { level, current: xp % perLevel, needed: perLevel }
}

/** XP diario que cuenta como "meta cumplida". Pequeño a propósito: una clase lo cubre. */
export const DAILY_GOAL_XP = 30

/** Días de historial de XP que se conservan. */
const MAX_XP_DAYS = 60

/** Suma XP al total y al día de hoy, recortando el historial diario. */
export function gainXp(progress: StudentProgress, amount: number): StudentProgress {
  if (amount <= 0) return progress
  const day = today()
  const dailyXp = { ...progress.dailyXp, [day]: (progress.dailyXp[day] ?? 0) + amount }
  const days = Object.keys(dailyXp).sort()
  for (const old of days.slice(0, Math.max(0, days.length - MAX_XP_DAYS))) delete dailyXp[old]
  return { ...progress, xp: progress.xp + amount, dailyXp }
}

/** Los últimos `count` días en formato `YYYY-MM-DD`, del más antiguo a hoy. */
export function lastDays(count: number, from: string = today()): string[] {
  const base = Date.parse(from + 'T00:00:00Z')
  return Array.from({ length: count }, (_, i) =>
    new Date(base - (count - 1 - i) * 86_400_000).toISOString().slice(0, 10),
  )
}

/** Qué se ha hecho hoy: alimenta los retos del día. */
export function activityToday(progress: StudentProgress, day: string = today()) {
  const isToday = (iso: string) => today(new Date(iso)) === day
  return {
    xp: progress.dailyXp[day] ?? 0,
    lessons: Object.values(progress.lessons).filter(l => isToday(l.completedAt)).length,
    hands: progress.hands.filter(h => isToday(h.playedAt)).length,
  }
}

export interface ChestReward {
  xp: number
  /** Premio gordo: poco frecuente, para que abrir el cofre siempre ilusione. */
  jackpot: boolean
}

/**
 * Premio del cofre diario. Recompensa variable a propósito: la mayoría de días
 * 10-25 XP y, una de cada diez veces, 50. `random` se inyecta para las pruebas.
 */
export function rollChest(random: () => number = Math.random): ChestReward {
  if (random() < 0.1) return { xp: 50, jackpot: true }
  return { xp: 10 + Math.floor(random() * 16), jackpot: false }
}

/** ¿Se puede abrir hoy el cofre? Hace falta la meta diaria y no haberlo abierto ya. */
export function canOpenChest(progress: StudentProgress, day: string = today()): boolean {
  return (progress.dailyXp[day] ?? 0) >= DAILY_GOAL_XP && !progress.chests.includes(day)
}

/** Abre el cofre de hoy: suma el premio y lo anota. Sin efecto si no toca. */
export function openChest(progress: StudentProgress, reward: ChestReward, day: string = today()): StudentProgress {
  if (!canOpenChest(progress, day)) return progress
  return { ...gainXp(progress, reward.xp), chests: [...progress.chests, day].slice(-60) }
}
