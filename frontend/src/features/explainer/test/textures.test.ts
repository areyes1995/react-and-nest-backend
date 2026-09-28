// ──────────────────────────────────────────────
// Mesas por pestañas: cada textura de board es una
// mano legal para el motor y las cuatro existen.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { cardToString } from '@poker/engine'
import { TEXTURE_SCENES } from '../textures'
import { buildScene } from '../script'

describe('mesa de texturas', () => {
  it('tiene las cuatro texturas con ids únicos', () => {
    expect(TEXTURE_SCENES.map(scene => scene.id)).toEqual([
      'texture-seco',
      'texture-humedo',
      'texture-emparejado',
      'texture-monocolor',
    ])
  })

  for (const scene of TEXTURE_SCENES) {
    it(`«${scene.title}» se juega entera sin acciones ilegales`, () => {
      const frames = buildScene(scene)
      expect(frames.beats).toHaveLength(scene.beats.length)
      expect(frames.heroId).toBe('hero')
      const hero = frames.initial.players.find(p => p.id === 'hero')
      expect(hero?.holeCards.map(cardToString)).toEqual(scene.players[0].cards?.split(' '))
      const last = frames.beats.at(-1)?.states.at(-1) ?? frames.initial
      if (scene.board) {
        const dealt = last.board.map(cardToString)
        expect(scene.board.split(' ').slice(0, dealt.length)).toEqual(dealt)
      }
    })
  }
})
