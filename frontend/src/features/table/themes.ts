// ──────────────────────────────────────────────
// Estilos de la mesa de práctica.
// Cada estilo es solo datos: colores (como variables
// CSS que ya leen la mesa, las cartas y las fichas),
// la forma del tapete, el dorso y la cara de las
// cartas. Añadir uno nuevo es añadir una entrada a
// TABLE_THEMES; ningún componente cambia.
//
// El clásico no fija colores: hereda los tokens de
// index.css, así sigue respondiendo al tema claro /
// oscuro como siempre.
// ──────────────────────────────────────────────

import type { CSSProperties } from 'react'

/** Silueta del tapete. Los asientos siguen sobre la elipse en todas. */
export type TableShape = 'oval' | 'stadium' | 'rectangle' | 'octagon'

/** Adorno pintado sobre el tapete. */
export type FeltMark = 'line' | 'double' | 'logo' | 'neon' | 'none'

/** `classic`: índice pequeño y palo central. `jumbo`: índice grande, como en las salas online. */
export type CardFace = 'classic' | 'jumbo'

export type CardBackPattern = 'stripes' | 'diamonds' | 'dots' | 'solid'

export interface TableTheme {
  id: string
  name: string
  /** De dónde sale la idea, en una línea. */
  inspiration: string
  shape: TableShape
  feltMark: FeltMark
  /** Barandilla acolchada con costura (cuero). */
  railStitch?: boolean
  cardFace: CardFace
  cardBack: CardBackPattern
  /** Baraja de cuatro colores: ♦ azul y ♣ verde, como en PokerStars o GGPoker. */
  fourColor?: boolean
  /** Variables CSS que sobrescribe (`--poker-*`). Vacío = tokens de index.css. */
  vars: Record<string, string>
}

export const TABLE_THEMES: TableTheme[] = [
  {
    id: 'classic',
    name: 'Clásica',
    inspiration: 'La mesa de siempre: tapete verde de casino y madera',
    shape: 'oval',
    feltMark: 'line',
    cardFace: 'classic',
    cardBack: 'stripes',
    vars: {},
  },
  {
    id: 'vegas',
    name: 'Las Vegas',
    inspiration: 'Salas del Strip: fieltro burdeos, caoba y detalles dorados',
    shape: 'oval',
    feltMark: 'double',
    cardFace: 'classic',
    cardBack: 'diamonds',
    vars: {
      '--poker-felt': '#8e1b2b',
      '--poker-felt-edge': '#3d0710',
      '--poker-rail': '#5a2e17',
      '--poker-rail-edge': '#2a1208',
      '--poker-gold': '#e8b84a',
      '--poker-card-bg': '#fffdf6',
      '--poker-card-back-a': '#9f1239',
      '--poker-card-back-b': '#4c0519',
      '--poker-seat-bg': 'rgba(28, 10, 12, 0.9)',
    },
  },
  {
    id: 'online-blue',
    name: 'Sala online',
    inspiration: 'Mesas azules de las salas online, baraja de cuatro colores',
    shape: 'stadium',
    feltMark: 'logo',
    cardFace: 'jumbo',
    cardBack: 'solid',
    fourColor: true,
    vars: {
      '--poker-felt': '#1d5fa8',
      '--poker-felt-edge': '#0b2a52',
      '--poker-rail': '#2b3038',
      '--poker-rail-edge': '#0d0f13',
      '--poker-gold': '#f5c542',
      '--poker-card-bg': '#ffffff',
      '--poker-card-back-a': '#c81e1e',
      '--poker-card-back-b': '#7f1010',
      '--poker-seat-bg': 'rgba(10, 16, 28, 0.92)',
    },
  },
  {
    id: 'neon',
    name: 'Neón',
    inspiration: 'Apps modernas (estilo GGPoker/ClubGG): tapete oscuro y borde luminoso',
    shape: 'octagon',
    feltMark: 'neon',
    cardFace: 'jumbo',
    cardBack: 'dots',
    fourColor: true,
    vars: {
      '--poker-felt': '#1b1537',
      '--poker-felt-edge': '#07051a',
      '--poker-rail': '#15131f',
      '--poker-rail-edge': '#050409',
      '--poker-gold': '#22d3ee',
      '--poker-glow': '#a855f7',
      '--poker-card-bg': '#f8fafc',
      '--poker-card-back-a': '#7c3aed',
      '--poker-card-back-b': '#1e1b4b',
      '--poker-seat-bg': 'rgba(12, 8, 30, 0.9)',
    },
  },
  {
    id: 'tv-final',
    name: 'Mesa final TV',
    inspiration: 'Mesas finales televisadas (WSOP, EPT): azul acero y cuero negro',
    shape: 'rectangle',
    feltMark: 'logo',
    railStitch: true,
    cardFace: 'jumbo',
    cardBack: 'stripes',
    fourColor: true,
    vars: {
      '--poker-felt': '#27435e',
      '--poker-felt-edge': '#0f1c2b',
      '--poker-rail': '#1c1c1f',
      '--poker-rail-edge': '#050506',
      '--poker-gold': '#f59e0b',
      '--poker-card-bg': '#ffffff',
      '--poker-card-back-a': '#111827',
      '--poker-card-back-b': '#374151',
      '--poker-seat-bg': 'rgba(6, 8, 12, 0.92)',
    },
  },
  {
    id: 'monte-carlo',
    name: 'Monte Carlo',
    inspiration: 'Clubes privados europeos: esmeralda profundo, cuero y cartas crema',
    shape: 'oval',
    feltMark: 'double',
    railStitch: true,
    cardFace: 'classic',
    cardBack: 'diamonds',
    vars: {
      '--poker-felt': '#0b5d4b',
      '--poker-felt-edge': '#02251d',
      '--poker-rail': '#3b2415',
      '--poker-rail-edge': '#140a04',
      '--poker-gold': '#d4af37',
      '--poker-card-bg': '#fbf6e9',
      '--poker-suit-red': '#a4161a',
      '--poker-card-back-a': '#065f46',
      '--poker-card-back-b': '#022c22',
      '--poker-seat-bg': 'rgba(8, 18, 14, 0.9)',
    },
  },
  {
    id: 'minimal',
    name: 'Minimalista',
    inspiration: 'Apps móviles planas: pizarra gris, sin brillos y cartas grandes',
    shape: 'stadium',
    feltMark: 'none',
    cardFace: 'jumbo',
    cardBack: 'solid',
    fourColor: true,
    vars: {
      '--poker-felt': '#3a4250',
      '--poker-felt-edge': '#2a303b',
      '--poker-rail': '#1f232b',
      '--poker-rail-edge': '#1a1d24',
      '--poker-gold': '#34d399',
      '--poker-card-bg': '#ffffff',
      '--poker-card-back-a': '#0f766e',
      '--poker-card-back-b': '#115e59',
      '--poker-seat-bg': 'rgba(20, 23, 29, 0.94)',
    },
  },
  {
    id: 'underground',
    name: 'Club clandestino',
    inspiration: 'Timbas de trastienda: fieltro oliva gastado y luz cálida',
    shape: 'rectangle',
    feltMark: 'line',
    cardFace: 'classic',
    cardBack: 'stripes',
    vars: {
      '--poker-felt': '#4b5a2a',
      '--poker-felt-edge': '#1c220d',
      '--poker-rail': '#4a3622',
      '--poker-rail-edge': '#1d140b',
      '--poker-gold': '#f59e0b',
      '--poker-card-bg': '#f5efdf',
      '--poker-card-back-a': '#78350f',
      '--poker-card-back-b': '#451a03',
      '--poker-seat-bg': 'rgba(20, 15, 8, 0.9)',
    },
  },
]

export const DEFAULT_TABLE_THEME_ID = 'classic'

export const CLASSIC_TABLE_THEME = TABLE_THEMES[0]

export function findTableTheme(id: string | null | undefined): TableTheme | undefined {
  return TABLE_THEMES.find(theme => theme.id === id)
}

export function isTableThemeId(id: unknown): id is string {
  return typeof id === 'string' && findTableTheme(id) !== undefined
}

/** Variables del estilo listas para `style`. */
export function tableThemeStyle(theme: TableTheme): CSSProperties {
  return theme.vars as CSSProperties
}

// ─── Formas ─────────────────────────────────

/** Vértices del octógono en un cuadro 0..100; sirven al recorte y a los contornos SVG. */
export const OCTAGON_POINTS: [number, number][] = [
  [16, 0], [84, 0], [100, 26], [100, 74], [84, 100], [16, 100], [0, 74], [0, 26],
]

const OCTAGON = `polygon(${OCTAGON_POINTS.map(([x, y]) => `${x}% ${y}%`).join(', ')})`

/**
 * Silueta de una capa del tapete. El octógono no admite `border-radius`:
 * se recorta con `clip-path`, y por eso la sombra va como `drop-shadow`.
 */
export function shapeStyle(shape: TableShape): CSSProperties {
  switch (shape) {
    case 'stadium':
      return { borderRadius: '9999px' }
    case 'rectangle':
      return { borderRadius: '10% / 16%' }
    case 'octagon':
      return { clipPath: OCTAGON }
    default:
      return { borderRadius: '46% / 50%' }
  }
}

// ─── Dorso de las cartas ────────────────────

/** Fondo del dorso: dos colores del estilo más la trama. */
export function cardBackBackground(pattern: CardBackPattern): string {
  const a = 'var(--poker-card-back-a, #1e3a8a)'
  const b = 'var(--poker-card-back-b, #1e1b4b)'
  const base = `linear-gradient(135deg, ${a} 0%, ${b} 100%)`
  switch (pattern) {
    case 'diamonds':
      return `repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0 2px, transparent 2px 7px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.1) 0 2px, transparent 2px 7px), ${base}`
    case 'dots':
      return `radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1.5px) 0 0 / 5px 5px, ${base}`
    case 'solid':
      return base
    default:
      return `repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0 3px, transparent 3px 6px), ${base}`
  }
}
