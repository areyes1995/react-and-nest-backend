// ──────────────────────────────────────────────
// guide — el acompañamiento del estudiante:
// itinerario, recorrido guiado y preferencias.
// ──────────────────────────────────────────────

export { GuideProvider, useGuide } from './GuideContext'
export type { GuideContextValue } from './GuideContext'
export { default as GuidedTour } from './GuidedTour'
export { buildJourney, journeyStatus, visitedSlug } from './journey'
export type { JourneyStage, JourneyStatus } from './journey'
export { DEFAULT_GUIDE_STATE, TOUR_VERSION, readGuideState, writeGuideState } from './storage'
export type { GuideState } from './storage'
