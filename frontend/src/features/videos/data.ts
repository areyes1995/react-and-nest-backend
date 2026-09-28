// ──────────────────────────────────────────────
// Videos — biblioteca de tutoriales.
// Cada video declara su fuente; mientras esté en
// `pending` el reproductor muestra el guion, los
// capítulos y los puntos clave, que es lo que de
// verdad estudia el alumno. Conectar la fuente
// definitiva es cambiar un campo.
// ──────────────────────────────────────────────

import type { LevelId } from '@features/academy/types'

export type VideoSource =
  | { kind: 'pending' }
  | { kind: 'youtube'; id: string }
  | { kind: 'vimeo'; id: string }
  | { kind: 'mp4'; url: string }

export interface VideoChapter {
  /** Segundo de inicio del capítulo. */
  at: number
  title: string
}

export interface Video {
  id: string
  slug: string
  title: string
  description: string
  level: LevelId
  /** Playlist a la que pertenece. */
  playlistId: string
  instructor: string
  /** Duración en segundos. */
  duration: number
  publishedAt: string
  tags: string[]
  source: VideoSource
  chapters: VideoChapter[]
  /** Ideas que el estudiante debe llevarse del video. */
  takeaways: string[]
}

export interface Playlist {
  id: string
  title: string
  description: string
  icon: string
  level: LevelId
}

export const PLAYLISTS: Playlist[] = [
  {
    id: 'pl-basics',
    title: 'Primeros pasos',
    description: 'Todo lo que necesitas para sentarte a jugar con criterio.',
    icon: 'Sprout',
    level: 'beginner',
  },
  {
    id: 'pl-postflop',
    title: 'Dominar el postflop',
    description: 'Texturas, c-bets y planificación de calles.',
    icon: 'Layers',
    level: 'intermediate',
  },
  {
    id: 'pl-ranges',
    title: 'Rangos y lectura',
    description: 'Pensar en combinaciones y construir la mano del rival.',
    icon: 'Grid3x3',
    level: 'advanced',
  },
  {
    id: 'pl-mindset',
    title: 'Oficio y mentalidad',
    description: 'Bankroll, tilt y revisión: lo que sostiene el resultado.',
    icon: 'Brain',
    level: 'pro',
  },
]

/** Duración legible: 754 → "12:34". */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export const VIDEOS: Video[] = [
  {
    id: 'v-reglas',
    slug: 'reglas-en-diez-minutos',
    title: 'Las reglas del Hold\'em en diez minutos',
    description:
      'Recorrido completo por una mano: ciegas, calles, acciones y showdown, con una mesa real de ejemplo.',
    level: 'beginner',
    playlistId: 'pl-basics',
    instructor: 'Equipo Poker Academy',
    duration: 612,
    publishedAt: '2026-01-15',
    tags: ['reglas', 'básico'],
    source: { kind: 'pending' },
    chapters: [
      { at: 0, title: 'Objetivo del juego' },
      { at: 75, title: 'Las ciegas y el botón' },
      { at: 190, title: 'Preflop: primera ronda' },
      { at: 320, title: 'Flop, turn y river' },
      { at: 470, title: 'Showdown y reparto del bote' },
      { at: 560, title: 'Errores típicos del primer día' },
    ],
    takeaways: [
      'La mano se juega en cuatro rondas de apuestas, no en una.',
      'Se usan siempre cinco cartas, vengan de donde vengan.',
      'Si todos se retiran, no hay showdown: nadie ve tus cartas.',
    ],
  },
  {
    id: 'v-ranking',
    slug: 'ranking-de-manos-visual',
    title: 'Ranking de manos explicado visualmente',
    description: 'Cada categoría con ejemplos en mesa y los errores de lectura más frecuentes.',
    level: 'beginner',
    playlistId: 'pl-basics',
    instructor: 'Equipo Poker Academy',
    duration: 486,
    publishedAt: '2026-01-22',
    tags: ['ranking', 'básico'],
    source: { kind: 'pending' },
    chapters: [
      { at: 0, title: 'De carta alta a escalera real' },
      { at: 140, title: 'El papel del kicker' },
      { at: 260, title: 'La rueda A-2-3-4-5' },
      { at: 350, title: 'Board emparejado: cuidado con el full' },
    ],
    takeaways: [
      'El color gana a la escalera; el full gana al color.',
      'Con la misma categoría deciden los kickers, uno a uno.',
      'El as vale como 1 para formar la escalera más baja.',
    ],
  },
  {
    id: 'v-posicion',
    slug: 'posicion-explicada',
    title: 'Posición: la ventaja que no se ve',
    description: 'Por qué la misma mano vale el doble desde el botón que desde la ciega pequeña.',
    level: 'beginner',
    playlistId: 'pl-basics',
    instructor: 'Equipo Poker Academy',
    duration: 534,
    publishedAt: '2026-02-05',
    tags: ['posición', 'preflop'],
    source: { kind: 'pending' },
    chapters: [
      { at: 0, title: 'Qué es la posición' },
      { at: 110, title: 'Las seis posiciones de una mesa corta' },
      { at: 265, title: 'La misma mano en dos posiciones' },
      { at: 410, title: 'Por qué las ciegas pierden dinero' },
    ],
    takeaways: [
      'Actuar el último te da información gratis en cada calle.',
      'El botón es la única posición que mantiene la ventaja toda la mano.',
      'En las ciegas el objetivo no es ganar, es perder menos.',
    ],
  },
  {
    id: 'v-potodds',
    slug: 'pot-odds-en-la-practica',
    title: 'Pot odds en la práctica',
    description: 'Tres manos reales resueltas paso a paso con el cálculo hecho en voz alta.',
    level: 'beginner',
    playlistId: 'pl-basics',
    instructor: 'Equipo Poker Academy',
    duration: 726,
    publishedAt: '2026-02-19',
    tags: ['matemáticas', 'pot odds'],
    source: { kind: 'pending' },
    chapters: [
      { at: 0, title: 'La fórmula en treinta segundos' },
      { at: 95, title: 'Mano 1: proyecto de color en el flop' },
      { at: 290, title: 'Mano 2: escalera interior en el turn' },
      { at: 470, title: 'Mano 3: odds implícitas' },
      { at: 650, title: 'Tabla mental para llevarte' },
    ],
    takeaways: [
      'Equity necesaria = apuesta ÷ (bote + apuesta).',
      'Proyecto de color paga casi cualquier apuesta; escalera interior casi ninguna.',
      'Las odds implícitas justifican pagos que las pot odds puras rechazan.',
    ],
  },
  {
    id: 'v-texturas',
    slug: 'leer-la-textura-del-flop',
    title: 'Leer la textura del flop',
    description: 'Clasificar cualquier flop en segundos y saber a quién favorece.',
    level: 'intermediate',
    playlistId: 'pl-postflop',
    instructor: 'Equipo Poker Academy',
    duration: 812,
    publishedAt: '2026-03-12',
    tags: ['postflop', 'texturas'],
    source: { kind: 'pending' },
    chapters: [
      { at: 0, title: 'Seco, húmedo, emparejado, monocolor' },
      { at: 175, title: 'Ventaja de rango: quién posee el board' },
      { at: 395, title: 'Diez flops de ejemplo' },
      { at: 640, title: 'Cómo cambia tu plan según la textura' },
    ],
    takeaways: [
      'Boards de cartas altas favorecen a quien abrió preflop.',
      'Boards bajos y conectados favorecen a quien defendió la ciega.',
      'La textura decide el tamaño de tu apuesta antes que tu mano.',
    ],
  },
  {
    id: 'v-cbet',
    slug: 'continuation-bet-cuando-si-y-cuando-no',
    title: 'Continuation bet: cuándo sí y cuándo no',
    description: 'Los cuatro escenarios en los que pasar gana más dinero que apostar.',
    level: 'intermediate',
    playlistId: 'pl-postflop',
    instructor: 'Equipo Poker Academy',
    duration: 690,
    publishedAt: '2026-03-26',
    tags: ['c-bet', 'postflop'],
    source: { kind: 'pending' },
    chapters: [
      { at: 0, title: 'Por qué funciona la c-bet' },
      { at: 130, title: 'Las cuatro condiciones' },
      { at: 340, title: 'Los cuatro escenarios de pasar' },
      { at: 540, title: 'El coste de la c-bet automática' },
    ],
    takeaways: [
      'El rival falla el flop dos de cada tres veces: ahí está el negocio.',
      'Con tres o más rivales, la c-bet pierde casi todo su valor.',
      'Apostar el 100% de los flops hace que tus apuestas no signifiquen nada.',
    ],
  },
  {
    id: 'v-sizing',
    slug: 'elegir-el-tamano-de-apuesta',
    title: 'Elegir el tamaño de apuesta',
    description: 'Un objetivo por tamaño: de un tercio a sobreapuesta, con ejemplos de cada uno.',
    level: 'intermediate',
    playlistId: 'pl-postflop',
    instructor: 'Equipo Poker Academy',
    duration: 748,
    publishedAt: '2026-04-09',
    tags: ['sizing', 'estrategia'],
    source: { kind: 'pending' },
    chapters: [
      { at: 0, title: '¿Qué quiero conseguir con esta apuesta?' },
      { at: 150, title: 'Un tercio: que pague todo su rango' },
      { at: 320, title: 'Dos tercios: valor equilibrado' },
      { at: 480, title: 'Bote y sobreapuesta: polarizar' },
      { at: 620, title: 'Errores de tamaño más caros' },
    ],
    takeaways: [
      'Cuanto más húmedo el board, más grande la apuesta.',
      'Un tercio solo necesita funcionar el 25% de las veces como farol.',
      'Usar siempre el mismo tamaño regala información.',
    ],
  },
  {
    id: 'v-perfiles',
    slug: 'identificar-tipos-de-rival',
    title: 'Identificar tipos de rival en diez manos',
    description: 'Los cuatro arquetipos, cómo detectarlos rápido y el ajuste concreto para cada uno.',
    level: 'intermediate',
    playlistId: 'pl-postflop',
    instructor: 'Equipo Poker Academy',
    duration: 654,
    publishedAt: '2026-04-23',
    tags: ['rivales', 'ajustes'],
    source: { kind: 'pending' },
    chapters: [
      { at: 0, title: 'Los dos ejes: tight/loose y pasivo/agresivo' },
      { at: 160, title: 'Nit y TAG' },
      { at: 330, title: 'Calling station y maniac' },
      { at: 500, title: 'El ajuste que más dinero da' },
    ],
    takeaways: [
      'Nunca farolees a una calling station.',
      'Roba sin descanso las ciegas de un nit.',
      'Dos manos no son una lectura: espera un patrón.',
    ],
  },
  {
    id: 'v-rangos',
    slug: 'construir-el-rango-del-rival',
    title: 'Construir el rango del rival calle a calle',
    description: 'Método práctico para estrechar el rango sin software, con una mano completa de ejemplo.',
    level: 'advanced',
    playlistId: 'pl-ranges',
    instructor: 'Equipo Poker Academy',
    duration: 934,
    publishedAt: '2026-05-14',
    tags: ['rangos', 'lectura'],
    source: { kind: 'pending' },
    chapters: [
      { at: 0, title: 'De "qué tiene" a "qué puede tener"' },
      { at: 175, title: 'El rango de partida por posición' },
      { at: 380, title: 'Recortar en flop y turn' },
      { at: 620, title: 'El rango final del river' },
      { at: 800, title: 'Contar combinaciones a mano' },
    ],
    takeaways: [
      'Hay 6 combinaciones de cada pareja y 16 de cada mano no emparejada.',
      'Cada acción del rival recorta su rango: úsalo en orden.',
      'El tamaño de su apuesta te dice si su rango es polarizado o lineal.',
    ],
  },
  {
    id: 'v-bloqueadores',
    slug: 'bloqueadores-y-faroles',
    title: 'Bloqueadores: elegir con qué farolear',
    description: 'Por qué la peor mano de tu rango suele ser el mejor farol.',
    level: 'advanced',
    playlistId: 'pl-ranges',
    instructor: 'Equipo Poker Academy',
    duration: 712,
    publishedAt: '2026-05-28',
    tags: ['bloqueadores', 'farol'],
    source: { kind: 'pending' },
    chapters: [
      { at: 0, title: 'Qué es un bloqueador' },
      { at: 145, title: 'El as del palo del color' },
      { at: 330, title: 'Elegir el farol dentro de tu rango' },
      { at: 520, title: 'Tres manos de river resueltas' },
    ],
    takeaways: [
      'Farolea con manos que nunca ganan en showdown.',
      'Bloquear la mano máxima del rival aumenta mucho el ratio de éxito.',
      'La segunda mejor mano se pasa, no se farolea.',
    ],
  },
  {
    id: 'v-3bet',
    slug: 'construir-un-rango-de-3bet',
    title: 'Construir un rango de 3-bet',
    description: 'Valor y farol en la misma resubida, y por qué A5s es mejor farol que AJo.',
    level: 'advanced',
    playlistId: 'pl-ranges',
    instructor: 'Equipo Poker Academy',
    duration: 786,
    publishedAt: '2026-06-11',
    tags: ['preflop', '3-bet'],
    source: { kind: 'pending' },
    chapters: [
      { at: 0, title: 'Por qué un rango solo de valor es transparente' },
      { at: 190, title: 'El componente de valor' },
      { at: 370, title: 'El componente de farol' },
      { at: 570, title: 'Responder al 4-bet' },
    ],
    takeaways: [
      'A5s bloquea ases y juega bien si te pagan.',
      'AJo está dominada por casi todo lo que paga una 3-bet.',
      'Fuera de posición, simplifica y estrecha.',
    ],
  },
  {
    id: 'v-bankroll',
    slug: 'bankroll-y-varianza',
    title: 'Bankroll y varianza sin mitos',
    description: 'Cuánto necesitas por formato y cómo escribir tus reglas de subida y bajada.',
    level: 'pro',
    playlistId: 'pl-mindset',
    instructor: 'Equipo Poker Academy',
    duration: 668,
    publishedAt: '2026-07-02',
    tags: ['bankroll', 'gestión'],
    source: { kind: 'pending' },
    chapters: [
      { at: 0, title: 'Qué es realmente la varianza' },
      { at: 170, title: 'Números por formato' },
      { at: 380, title: 'Las dos reglas escritas' },
      { at: 540, title: 'Cuándo bajar de límite sin drama' },
    ],
    takeaways: [
      'Un bankroll corto cambia tus decisiones en los botes grandes.',
      'Las reglas de subida y bajada se escriben antes de jugar.',
      'Bajar de límite es una decisión técnica, no un fracaso.',
    ],
  },
]

export function findVideo(slug: string): Video | undefined {
  return VIDEOS.find(video => video.slug === slug)
}

export function videosOfPlaylist(playlistId: string): Video[] {
  return VIDEOS.filter(video => video.playlistId === playlistId)
}
