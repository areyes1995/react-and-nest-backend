// ──────────────────────────────────────────────
// La tabla del paso marca la fila (o la columna)
// de lo que está diciendo la mesa con audio.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { tableFocusForText } from '@features/explainer/tableRows'
import { findScene } from '@features/explainer/scenes'
import type { ContentBlock } from '@features/academy/types'

type Table = Extract<ContentBlock, { type: 'table' }>

const positions: Table = {
  type: 'table',
  headers: ['Posición', 'Abreviatura', 'Cuándo actúa', 'Manos jugables'],
  rows: [
    ['Primera posición', 'UTG', 'Primero preflop', 'Muy pocas, solo fuertes'],
    ['Posición media', 'MP', 'Segundo', 'Pocas'],
    ['Cutoff', 'CO', 'Penúltimo', 'Bastantes'],
    ['Botón', 'BTN', 'Último preflop y postflop', 'Muchas'],
    ['Ciega pequeña', 'SB', 'Primero postflop', 'Selectivo: mala posición'],
    ['Ciega grande', 'BB', 'Último preflop, casi primero postflop', 'Defiende ancho por descuento'],
  ],
}

const streets: Table = {
  type: 'table',
  headers: ['Calle', 'Cartas en mesa', 'Qué se decide'],
  rows: [
    ['Preflop', 'Ninguna', 'Si entras al bote'],
    ['Flop', '3 cartas', 'Si tu mano encaja'],
    ['Turn', '4 cartas', 'Si sigues'],
    ['River', '5 cartas', 'Cuánto valor extraes'],
  ],
}

const actions: Table = {
  type: 'table',
  headers: ['Acción', 'Disponible cuando', 'Qué significa'],
  rows: [['Pasar (check)'], ['Apostar (bet)'], ['Igualar (call)'], ['Subir (raise)'], ['Retirarse (fold)']].map(
    ([label]) => [label, '', ''],
  ),
}

const outs: Table = {
  type: 'table',
  headers: ['Proyecto', 'Outs', 'En el flop (×4)', 'En el turn (×2)'],
  rows: [['Escalera abierta', '8', '32%', '16%']],
}

const rowsFor = (table: Table, sceneId: string) =>
  findScene(sceneId)!.beats.map(beat => tableFocusForText(table, beat.say).row)

describe('tableFocusForText', () => {
  it('sigue las posiciones de la escena de los asientos', () => {
    // Botón, SB, UTG, hijack (= posición media), botón, ciegas, …, botón.
    expect(rowsFor(positions, 'seats').slice(0, 5)).toEqual([3, 4, 0, 1, 3])
  })

  it('sigue las calles de la mano', () => {
    expect(rowsFor(streets, 'streets').slice(0, 4)).toEqual([0, 1, 2, 3])
  })

  it('sigue las acciones en español o en inglés', () => {
    expect(rowsFor(actions, 'actions').slice(0, 2)).toEqual([2, 0])
    expect(tableFocusForText(actions, 'Subir, o raise: Luis sube a 300.').row).toBe(3)
  })

  it('"antes del flop" es preflop, no el flop', () => {
    expect(tableFocusForText(streets, 'Todo se decide antes del flop.').row).toBe(0)
  })

  it('sin fila que encaje, marca la columna', () => {
    expect(tableFocusForText(outs, 'En el turn te quedan menos cartas.')).toEqual({ row: null, column: 3 })
  })

  it('sin nada que encaje no marca nada', () => {
    expect(tableFocusForText(streets, 'Ana piensa.')).toEqual({ row: null, column: null })
    expect(tableFocusForText(streets, null)).toEqual({ row: null, column: null })
  })
})
