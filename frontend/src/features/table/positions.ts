// ──────────────────────────────────────────────
// Posiciones de la mesa — el dato que más decide y
// el que peor se lee.
// El motor devuelve la etiqueta corta (`BTN`, `CO`…),
// que a un estudiante nuevo no le dice nada. Aquí se
// le pone nombre, color y una frase que explica qué
// implica estar ahí. El color no es decorativo: va de
// rojo (posición mala, hay que jugar poco) a dorado
// (el botón, la posición que más dinero gana).
// ──────────────────────────────────────────────

export type PositionId = 'BTN' | 'SB' | 'BB' | 'UTG' | 'MP' | 'HJ' | 'CO'

export interface PositionMeta {
  id: PositionId
  /** Nombre completo, para la leyenda y el tooltip. */
  name: string
  /** Qué implica jugar desde aquí, en una frase. */
  hint: string
  color: string
  /** Calidad de la posición, 0 (peor) a 1 (mejor). Ordena la barra de ayuda. */
  quality: number
}

export const POSITIONS: Record<PositionId, PositionMeta> = {
  UTG: {
    id: 'UTG',
    name: 'Under the gun',
    hint: 'Eres el primero al que le toca actuar preflop y aún quedan todos por actuar detrás de ti: el rango más estrecho de la mesa.',
    color: '#ef4444',
    quality: 0,
  },
  MP: {
    id: 'MP',
    name: 'Posición media',
    hint: 'Algo mejor que UTG, pero todavía con mucha gente por actuar detrás de ti.',
    color: '#f97316',
    quality: 0.3,
  },
  HJ: {
    id: 'HJ',
    name: 'Hijack',
    hint: 'Ya puedes abrir más manos: solo quedan tres jugadores por actuar detrás de ti.',
    color: '#eab308',
    quality: 0.5,
  },
  CO: {
    id: 'CO',
    name: 'Cutoff',
    hint: 'La segunda mejor posición. Abres ancho y robas las ciegas con frecuencia.',
    color: '#22c55e',
    quality: 0.8,
  },
  BTN: {
    id: 'BTN',
    name: 'Botón',
    hint: 'Actúas el último en flop, turn y river. Es la posición que más dinero gana.',
    color: '#f2a93b',
    quality: 1,
  },
  SB: {
    id: 'SB',
    name: 'Ciega pequeña',
    hint: 'Pones media ciega a ciegas y actúas primero en todas las calles postflop.',
    color: '#a78bfa',
    quality: 0.1,
  },
  BB: {
    id: 'BB',
    name: 'Ciega grande',
    hint: 'Ya has pagado una ciega: cierras la acción preflop y defiendes más ancho.',
    color: '#38bdf8',
    quality: 0.2,
  },
}

/** Metadatos de una posición; tolera etiquetas desconocidas del motor. */
export function positionMeta(label: string): PositionMeta | null {
  return POSITIONS[label as PositionId] ?? null
}

/** `true` si la posición actúa después del rival en las calles postflop. */
export function isLatePosition(label: string): boolean {
  const meta = positionMeta(label)
  return meta !== null && meta.quality >= 0.8
}
