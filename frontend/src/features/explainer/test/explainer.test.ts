// ──────────────────────────────────────────────
// Modo explicativo: cada escena de la biblioteca es
// una mano legal para el motor, y la detección de
// conceptos elige la escena que toca.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { cardToString, parseCards, positionName } from '@poker/engine'
import { SCENES } from '../scenes'
import { buildScene } from '../script'
import { anchorScenes, lessonAnchors, matchScenes, bestScene, normalizeText } from '../match'
import type { ExplainerScene } from '../types'

describe('biblioteca de escenas', () => {
  it('tiene ids únicos', () => {
    expect(new Set(SCENES.map(scene => scene.id)).size).toBe(SCENES.length)
  })

  for (const scene of SCENES) {
    it(`«${scene.title}» se juega entera sin acciones ilegales`, () => {
      const frames = buildScene(scene)
      expect(frames.beats).toHaveLength(scene.beats.length)
      expect(frames.heroId).toBe(scene.players[0].id)

      // Las cartas del guion son las que se ven en la mesa.
      for (const player of scene.players) {
        if (!player.cards) continue
        const seated = frames.initial.players.find(p => p.id === player.id)
        expect(seated?.holeCards.map(cardToString)).toEqual(player.cards.split(' '))
      }

      // El board sale en el orden escrito, hasta donde llegue la mano.
      const last = frames.beats.at(-1)?.states.at(-1) ?? frames.initial
      if (scene.board) {
        const dealt = last.board.map(cardToString)
        expect(scene.board.split(' ').slice(0, dealt.length)).toEqual(dealt)
      }
    })
  }

  it('reparte las cartas sin repetir ninguna', () => {
    for (const scene of SCENES) {
      const { initial } = buildScene(scene)
      const cards = [...initial.players.flatMap(p => p.holeCards), ...initial.deck.slice(initial.deckIndex)]
      expect(new Set(cards).size).toBe(cards.length)
    }
  })

  it('no reparte la calle siguiente hasta el paso que habla de ella', () => {
    for (const scene of SCENES) {
      const { beats } = buildScene(scene)
      beats.slice(0, -1).forEach((beat, index) => {
        const end = beat.states.at(-1)!
        const next = beats[index + 1].states[0]
        // Al acabar un paso no hay cartas nuevas ni showdown a la vista…
        const beforeLast = beat.states.at(-2) ?? end
        expect(end.board.length, `${scene.id} paso ${index + 1}`).toBe(
          beat.states.length > 1 ? beforeLast.board.length : end.board.length,
        )
        expect(end.outcome && !end.outcome.uncontested, `${scene.id} paso ${index + 1}`).toBeFalsy()
        // …y el paso siguiente arranca con ellas.
        expect(next.board.length).toBeGreaterThanOrEqual(end.board.length)
      })
    }
  })

  it('en «Las calles» el flop sale cuando se nombra el flop', () => {
    const { beats } = buildScene(SCENES.find(scene => scene.id === 'streets')!)
    expect(beats[0].states.at(-1)!.board).toHaveLength(0)
    expect(beats[0].states.at(-1)!.street).toBe('preflop')
    expect(beats[1].states[0].board).toHaveLength(3)
  })

  it('en el all-in las cartas y el ganador esperan al último paso', () => {
    const { beats } = buildScene(SCENES.find(scene => scene.id === 'all-in')!)
    const called = beats[2].states.at(-1)!
    expect(called.board).toHaveLength(0)
    expect(called.outcome).toBeUndefined()
    expect(called.players.find(p => p.id === 'hero')?.lastAction?.type).toBe('call')
    expect(beats[3].states[0].board).toHaveLength(5)
    expect(beats[3].states[0].outcome).toBeDefined()
  })

  it('falla al construir si alguien actúa fuera de turno', () => {
    const broken: ExplainerScene = {
      ...SCENES.find(scene => scene.id === 'cbet')!,
      beats: [{ say: 'El héroe habla antes que UTG.', actions: [{ player: 'hero', type: 'fold' }] }],
    }
    expect(() => buildScene(broken)).toThrow(/le toca a marta/)
  })

  it('falla si el guion repite una carta', () => {
    const broken: ExplainerScene = {
      ...SCENES.find(scene => scene.id === 'cbet')!,
      board: 'As 7d 2c',
    }
    expect(() => buildScene(broken)).toThrow(/repetidas/)
    expect(parseCards('As')).toHaveLength(1)
  })
})

describe('detección de conceptos', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(normalizeText('Posición ÚLTIMO')).toBe('posicion ultimo')
  })

  it('reconoce el concepto concreto por encima de las calles', () => {
    const text = 'En el flop, quien subió preflop suele hacer una c-bet, la apuesta de continuación.'
    expect(bestScene(text)?.id).toBe('cbet')
    expect(matchScenes(text).map(match => match.scene.id)).toContain('streets')
  })

  it.each([
    ['El botón habla el último: jugar en posición da información.', 'position'],
    ['Cuenta tus outs y compáralos con las pot odds.', 'pot-odds'],
    ['Resubir, el 3-bet, cambia el tamaño del bote.', 'three-bet'],
    ['El check-raise en el flop es una línea fuerte.', 'check-raise'],
    ['Un buen farol cuenta una historia creíble.', 'bluff'],
    ['Con la misma pareja, decide el kicker.', 'kicker'],
    ['La ciega pequeña y la ciega grande son obligatorias.', 'blinds'],
    ['Las seis posiciones de una mesa de 6: U-T-G, HJ, CO y el botón.', 'seats'],
  ])('«%s» → %s', (text, id) => {
    expect(bestScene(text)?.id).toBe(id)
  })

  it('los alias fonéticos del guion detectan su escena', () => {
    expect(bestScene('El scuiz desde el botón')?.id).toBe('three-bet')
    expect(bestScene('El valiu bet fino')?.id).toBe('value-bet')
    expect(bestScene('Calcula tu ekuiti antes de pagar')?.id).toBe('pot-odds')
    expect(bestScene('Va ol-in por sus 1.200')?.id).toBe('all-in')
    expect(bestScene('Abrir con open reis a 125')?.id).toBe('open-raise')
    expect(bestScene('Igualar el kol para seguir')?.id).toBe('actions')
    expect(bestScene('Necesitas check-reises con valor')?.id).toBe('check-raise')
  })

  it('una mención negada casi no cuenta', () => {
    const text = 'Rivales pasivos: pagan demasiado y casi nunca faroleen. Mira tus pot odds.'
    expect(bestScene(text)?.id).toBe('pot-odds')
  })

  it('las ciegas como medida (20 ciegas grandes, BB/100) no son la posición', () => {
    expect(matchScenes('Ganas cuatro ciegas grandes cada cien manos con 20 ciegas grandes de stack.')).toEqual([])
    expect(matchScenes('BB/100, EV y varianza')).toEqual([])
    expect(bestScene('Defender la BB contra la SB')?.id).toBe('blinds')
  })

  it('no inventa un concepto donde no lo hay', () => {
    expect(matchScenes('Gestiona tu bankroll y descansa entre sesiones.')).toEqual([])
  })
})

describe('clase «Las posiciones de la mesa»', () => {
  it('el apartado de las seis posiciones lleva la mesa de las posiciones', () => {
    const texts = [
      'Las seis posiciones de una mesa de 6. Siguiendo el sentido de las agujas del reloj desde la ciega grande vienen las demás.',
      'U-T-G (under the gun): el primero a la izquierda de la ciega grande. HJ (hijack): el siguiente. CO (cutoff): justo antes del botón.',
    ]
    const anchors = anchorScenes(texts, { topic: 'Las seis posiciones de una mesa de 6' })
    expect([...anchors.values()].map(scene => scene.id)).toEqual(['seats'])
  })

  it('la mesa de las posiciones sale una sola vez, en el apartado que las explica', () => {
    const sections = [
      { title: 'Introducción', intro: true, texts: ['En esta clase aprendes las seis posiciones de una mesa de 6 y quién es quién.'] },
      { title: 'El botón y las ciegas', intro: false, texts: ['El botón, la ciega pequeña y la ciega grande.'] },
      { title: 'Las seis posiciones de una mesa de 6', intro: false, texts: ['U-T-G, HJ (hijack) y CO (cutoff).'] },
    ]
    const perStep = lessonAnchors(sections, { lessonTitle: 'Las posiciones de la mesa: quién es quién' })
    expect(perStep.map(anchors => [...anchors.values()].map(scene => scene.id))).toEqual([[], ['blinds'], ['seats']])
  })

  it('en la mesa, cada jugador lleva el nombre de su posición', () => {
    const { initial } = buildScene(SCENES.find(scene => scene.id === 'seats')!)
    const byName = Object.fromEntries(initial.players.map(p => [p.id, positionName(initial, p.seat)]))
    expect(byName).toEqual({ hero: 'BTN', ana: 'SB', luis: 'BB', marta: 'UTG', sofia: 'HJ', diego: 'CO' })
  })
})

describe('mesas dentro de la clase', () => {
  const ROUNDS =
    'Las cuatro rondas de apuestas. Calle, Cartas en mesa, Qué se decide. Preflop, ninguna. Flop, 3 cartas. Turn, 4 cartas. River, 5 cartas.'

  it('pone una mesa bajo la tabla de las cuatro rondas de apuestas', () => {
    const anchors = anchorScenes(['Cada jugador recibe dos cartas.', ROUNDS], { topic: 'Las cuatro rondas de apuestas' })
    expect([...anchors.entries()].map(([index, scene]) => [index, scene.id])).toEqual([[1, 'streets']])
  })

  it('una mención suelta de un concepto general no basta', () => {
    expect(anchorScenes(['Después, en el flop, piensa antes de actuar.']).size).toBe(0)
  })

  it('gana el concepto más concreto, en el primer bloque que lo trata, sin repetir', () => {
    const anchors = anchorScenes(
      ['Un farol en el river.', 'La c-bet en seco.', 'Otra c-bet, la apuesta de continuación.', 'Resubir con un 3-bet.'],
      { limit: 2 },
    )
    expect([...anchors.entries()].map(([index, scene]) => [index, scene.id])).toEqual([
      [1, 'cbet'],
      [3, 'three-bet'],
    ])
  })

  it('la apertura gana a la posición en «Rangos de apertura por posición»', () => {
    const texts = ['Un rango es el conjunto de manos con las que abres desde cada posición.', 'Tabla. UTG, en posición, botón.']
    expect([...anchorScenes(texts, { topic: 'Rangos de apertura por posición' }).values()][0].id).toBe('open-raise')
  })

  it('por defecto pone una sola mesa', () => {
    expect(anchorScenes(['La c-bet en seco.', 'Un farol en el river.']).size).toBe(1)
  })

  it('solo pone mesa si el concepto es el tema de la clase', () => {
    // "Tu primera sesión en la mesa": menciona pot odds y faroles, no los explica.
    const texts = [
      'Las reglas se fijan jugando, no leyendo. Rivales pasivos: pagan demasiado y casi nunca faroleen.',
      'Qué observar. Tras cada decisión verás tu equity real y las pot odds que te ofrecía la apuesta.',
    ]
    expect(anchorScenes(texts, { topic: 'Tu primera sesión en la mesa Introducción' }).size).toBe(0)
    expect(anchorScenes(texts, { topic: 'Pot odds: el precio de seguir' }).get(1)?.id).toBe('pot-odds')
  })

  it('las mesas de iniciación solo van en el nivel de fundamentos', () => {
    const texts = ['La ciega pequeña juega contra la ciega grande fuera de posición.']
    const topic = 'Jugar desde la ciega pequeña'
    expect(anchorScenes(texts, { topic }).get(0)?.id).toBe('blinds')
    expect(anchorScenes(texts, { topic, introductory: false }).size).toBe(0)
  })

  it('salta los bloques marcados como no analizables', () => {
    expect(anchorScenes([null, 'La c-bet en seco.']).get(1)?.id).toBe('cbet')
  })
})
