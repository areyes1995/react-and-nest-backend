// ──────────────────────────────────────────────
// Modo explicativo — tipos de una escena.
//
// Una escena es una mano guionizada que enseña un
// concepto (c-bet, posición, pot odds…): cartas y
// acciones fijas, repartidas en pasos ("beats").
// Cada paso lleva la frase que se lee y las
// acciones que ocurren en la mesa mientras suena.
//
// Las acciones no se dibujan a mano: se aplican
// sobre el motor de póker real (ver script.ts), así
// la mesa de la explicación es la misma que la de
// práctica y nunca muestra una jugada imposible.
//
// No confundir con la práctica guiada
// (features/academy/practice.ts): allí juega el
// estudiante contra bots; aquí mira una mano
// preparada para entender la idea.
// ──────────────────────────────────────────────

import type { PlayerAction } from '@poker/engine'

/** Jugador de la escena. El primero es el protagonista: se sienta abajo. */
export interface ScenePlayer {
  id: string
  name: string
  /** Cartas privadas, `As Kh`. Sin ellas se reparten al azar (y no se enseñan). */
  cards?: string
  /** Stack inicial; por defecto el de la escena. */
  stack?: number
}

/** Una acción de la mano, con quién la hace (se comprueba que le toque). */
export interface SceneAction extends PlayerAction {
  player: string
}

export interface SceneBeat {
  /** Lo que se explica en este paso: se muestra y se lee en voz alta. */
  say: string
  /** Acciones que ocurren durante el paso, en orden. */
  actions?: SceneAction[]
  /** Enseña las cartas de todos (showdown o para explicar un rango). */
  reveal?: boolean
}

export interface ExplainerScene {
  id: string
  /** Nombre del concepto, corto: "C-bet". */
  title: string
  /** Qué es, en una frase. */
  summary: string
  /**
   * Palabras que delatan que la clase habla de esto, ya en minúsculas y sin
   * tildes (se comparan con el texto normalizado). Admiten expresiones regulares.
   */
  keywords: string[]
  /**
   * Cuánto pesa una coincidencia: los conceptos concretos (c-bet, 3-bet)
   * ganan a los generales (las calles, las acciones) cuando aparecen juntos.
   */
  weight: number
  /**
   * Concepto de iniciación (qué son las calles, las ciegas…). Dentro del texto
   * de una clase solo se pone en el nivel de fundamentos: en una clase avanzada
   * de ciega pequeña contra ciega grande, explicar qué es una ciega no ayuda.
   * En el panel principal sigue disponible siempre.
   */
  introductory?: boolean
  players: ScenePlayer[]
  /** Id del jugador con el botón del dealer. */
  button: string
  blinds?: { small: number; big: number }
  /** Stack por defecto. */
  stack?: number
  /** Cartas comunitarias que saldrán, en orden: `Kh 7d 2c 9s 4h`. */
  board?: string
  beats: SceneBeat[]
}
