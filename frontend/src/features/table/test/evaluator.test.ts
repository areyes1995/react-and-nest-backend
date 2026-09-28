// ──────────────────────────────────────────────
// Evaluador de manos — casos que suelen fallar en
// implementaciones caseras: la rueda A-2-3-4-5,
// los kickers y el orden entre categorías.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { evaluate, parseCards, HAND_CATEGORY } from '@poker/engine'

const score = (cards: string) => evaluate(parseCards(cards)).score
const category = (cards: string) => evaluate(parseCards(cards)).category

describe('evaluate — categorías', () => {
  it('reconoce la escalera real', () => {
    expect(category('As Ks Qs Js Ts 2h 3d')).toBe(HAND_CATEGORY.STRAIGHT_FLUSH)
    expect(evaluate(parseCards('As Ks Qs Js Ts 2h 3d')).kickers[0]).toBe(14)
  })

  it('reconoce el póker por encima del full', () => {
    expect(score('9s 9h 9d 9c 2s 3h 4d')).toBeGreaterThan(score('9s 9h 9d Ac Ah 4d 5s'))
  })

  it('reconoce la rueda A-2-3-4-5 como escalera al 5', () => {
    const result = evaluate(parseCards('As 2h 3d 4c 5s Kd Qh'))
    expect(result.category).toBe(HAND_CATEGORY.STRAIGHT)
    expect(result.kickers[0]).toBe(5)
  })

  it('no confunde A-K-Q-J-9 con escalera', () => {
    expect(category('As Kh Qd Jc 9s 3h 2d')).toBe(HAND_CATEGORY.HIGH_CARD)
  })

  it('prefiere el color sobre la escalera', () => {
    expect(score('2s 4s 6s 8s Ts 3h 5d')).toBeGreaterThan(score('2s 3h 4d 5c 6s Kh Qd'))
  })

  it('detecta escalera de color con la rueda', () => {
    const result = evaluate(parseCards('As 2s 3s 4s 5s Kh Qd'))
    expect(result.category).toBe(HAND_CATEGORY.STRAIGHT_FLUSH)
    expect(result.kickers[0]).toBe(5)
  })

  it('arma el full con el trío más alto disponible', () => {
    const result = evaluate(parseCards('Ks Kh Kd 7c 7h 2s 3d'))
    expect(result.category).toBe(HAND_CATEGORY.FULL_HOUSE)
    expect(result.kickers).toEqual([13, 7])
  })

  it('usa el trío más alto cuando hay dos tríos', () => {
    const result = evaluate(parseCards('Ks Kh Kd 7c 7h 7s 3d'))
    expect(result.kickers).toEqual([13, 7])
  })
})

describe('evaluate — desempates', () => {
  it('desempata parejas por kicker', () => {
    expect(score('As Ah Kd 7c 5h 3s 2d')).toBeGreaterThan(score('Ac Ad Qs 7h 5c 3d 2h'))
  })

  it('desempata dobles parejas por la pareja alta', () => {
    expect(score('As Ah 2d 2c 9h 5s 3d')).toBeGreaterThan(score('Ks Kh Qd Qc 9s 5h 3c'))
  })

  it('desempata colores carta a carta', () => {
    expect(score('As Qs 9s 5s 3s 2h 4d')).toBeGreaterThan(score('As Qs 9s 5s 2s 3h 4d'))
  })

  it('declara empate exacto con el mismo board', () => {
    expect(score('As Ks Qh Jd Tc 2s 3d')).toBe(score('Ah Kh Qh Jd Tc 2s 3d'))
  })

  it('solo usa cinco cartas: el sexto kicker es irrelevante', () => {
    expect(score('As Ah Kd Qc Jh 9s 2d')).toBe(score('As Ah Kd Qc Jh 8s 2d'))
  })
})
