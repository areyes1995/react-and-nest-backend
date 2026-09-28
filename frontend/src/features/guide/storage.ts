// ──────────────────────────────────────────────
// Guide storage — lo que la guía necesita recordar
// entre sesiones: si el estudiante ya hizo el tour,
// qué zonas ha visitado y si prefiere leer las
// clases paso a paso o de corrido.
//
// Vive aparte del progreso académico a propósito:
// esto son preferencias de la interfaz, no
// expediente. Borrarlo no pierde ni una clase.
// ──────────────────────────────────────────────

const STORAGE_KEY = 'poker_academy_guide_v1'

/** Subir esta versión vuelve a lanzar el tour cuando la interfaz cambia. */
export const TOUR_VERSION = 1

export interface GuideState {
  /** Versión del tour que el estudiante ya completó o saltó. */
  tourSeenVersion: number
  /** Slugs de zonas ya visitadas (`play`, `equity`, `ranges`…). */
  visited: string[]
  /** La lista de primeros pasos está plegada. */
  checklistCollapsed: boolean
  /** Leer las clases paso a paso en vez de todo de una vez. */
  guidedReading: boolean
}

export const DEFAULT_GUIDE_STATE: GuideState = {
  tourSeenVersion: 0,
  visited: [],
  checklistCollapsed: false,
  guidedReading: true,
}

export function readGuideState(): GuideState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_GUIDE_STATE }
    const parsed = JSON.parse(raw) as Partial<GuideState>
    return {
      ...DEFAULT_GUIDE_STATE,
      ...parsed,
      visited: Array.isArray(parsed.visited) ? parsed.visited : [],
    }
  } catch {
    return { ...DEFAULT_GUIDE_STATE }
  }
}

export function writeGuideState(state: GuideState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Almacenamiento lleno o bloqueado: la guía sigue funcionando en memoria
    // y el tour volverá a ofrecerse en la próxima sesión.
  }
}

/** True si el tour actual todavía no se ha visto. */
export function shouldAutoStartTour(state: GuideState): boolean {
  return state.tourSeenVersion < TOUR_VERSION
}
