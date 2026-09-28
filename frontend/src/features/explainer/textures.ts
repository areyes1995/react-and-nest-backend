// ──────────────────────────────────────────────
// Escenas de texturas de board para la mesa
// interactiva por pestañas (`board-textures`).
//
// Una escena corta por textura, con la misma mano
// base (tú en el botón contra la ciega grande) para
// que solo cambie lo que importa: el flop y la
// línea correcta. Las frases están escritas para
// oírse, como el resto de escenas.
//
// No van en `scenes.ts`: no son conceptos del modo
// explicativo automático, sino pestañas de una
// mesa concreta dentro de la clase.
// ──────────────────────────────────────────────

import type { ExplainerScene } from './types'

const PREFLOP = [
  {
    say: 'Estás en el botón con una mano para abrir. La primera jugadora se retira.',
    actions: [{ player: 'marta', type: 'fold' as const }],
  },
  {
    say: 'Abres subiendo a 125 y la ciega pequeña se retira.',
    actions: [
      { player: 'hero', type: 'raise' as const, amount: 125 },
      { player: 'ana', type: 'fold' as const },
    ],
  },
  {
    say: 'La ciega grande paga. Vais dos al flop.',
    actions: [{ player: 'luis', type: 'call' as const }],
  },
]

export const TEXTURE_SCENES: ExplainerScene[] = [
  {
    id: 'texture-seco',
    title: 'Seco',
    summary: 'Rey, siete, dos de palos distintos: apuesta pequeña con casi todo tu rango.',
    keywords: ['board seco', 'flop seco'],
    weight: 1,
    players: [
      { id: 'hero', name: 'Tú', cards: 'As Qd' },
      { id: 'ana', name: 'Ana' },
      { id: 'luis', name: 'Luis' },
      { id: 'marta', name: 'Marta' },
    ],
    button: 'hero',
    board: 'Ks 7d 2c',
    beats: [
      ...PREFLOP,
      {
        say: 'Sale rey, siete, dos de palos distintos: un board seco. Casi no hay proyectos posibles y tus cartas altas encajan mucho mejor que su rango.',
        actions: [{ player: 'luis', type: 'check' as const }],
      },
      {
        say: 'Apuestas 90, un tercio del bote, con todo tu rango: necesita pocos folds y le das mal precio para defenderse de todo.',
        actions: [{ player: 'hero', type: 'bet' as const, amount: 90 }],
      },
      {
        say: 'Sin un rey no puede pagar: se retira y el bote es tuyo.',
        actions: [{ player: 'luis', type: 'fold' as const }],
      },
    ],
  },
  {
    id: 'texture-humedo',
    title: 'Húmedo',
    summary: 'Jota, diez, nueve con color: apuesta grande y solo con mano o proyecto serio.',
    keywords: ['board humedo', 'flop humedo', 'board conectado'],
    weight: 1,
    players: [
      { id: 'hero', name: 'Tú', cards: 'Qh Qc' },
      { id: 'ana', name: 'Ana' },
      { id: 'luis', name: 'Luis' },
      { id: 'marta', name: 'Marta' },
    ],
    button: 'hero',
    board: 'Jh Th 9s',
    beats: [
      ...PREFLOP,
      {
        say: 'Sale jota, diez, nueve con dos corazones: escaleras y colores por todas partes. Tu pareja de damas es fuerte pero vulnerable.',
        actions: [{ player: 'luis', type: 'check' as const }],
      },
      {
        say: 'Aquí lo pequeño regala precio a cada proyecto: apuestas 225, grande, para cobrarles caro y proteger tu mano.',
        actions: [{ player: 'hero', type: 'bet' as const, amount: 225 }],
      },
      {
        say: 'Sin nada hecho no puede pagar ese precio: se retira.',
        actions: [{ player: 'luis', type: 'fold' as const }],
      },
    ],
  },
  {
    id: 'texture-emparejado',
    title: 'Emparejado',
    summary: 'Ocho, ocho, tres: apuesta pequeña, pero si te suben, créetelo.',
    keywords: ['board emparejado', 'mesa emparejada'],
    weight: 1,
    players: [
      { id: 'hero', name: 'Tú', cards: 'Ad Ks' },
      { id: 'ana', name: 'Ana' },
      { id: 'luis', name: 'Luis' },
      { id: 'marta', name: 'Marta' },
    ],
    button: 'hero',
    board: '8s 8d 3c',
    beats: [
      ...PREFLOP,
      {
        say: 'Sale ocho, ocho, tres: mesa emparejada. Casi nunca tiene el ocho, así que tu apuesta pequeña gana muy a menudo.',
        actions: [{ player: 'luis', type: 'check' as const }],
      },
      {
        say: 'Apuestas 90, un tercio, con tu rango. Pero atención a lo que viene.',
        actions: [{ player: 'hero', type: 'bet' as const, amount: 90 }],
      },
      {
        say: 'Te sube a 300. A bote grande en mesa emparejada, alguien tiene el full: tus dos overcards no tienen precio. Te retiras.',
        actions: [
          { player: 'luis', type: 'raise' as const, amount: 300 },
          { player: 'hero', type: 'fold' as const },
        ],
      },
    ],
  },
  {
    id: 'texture-monocolor',
    title: 'Monocolor',
    summary: 'Tres tréboles: sin el as de ese palo, controla el bote.',
    keywords: ['board monocolor', 'flop monocolor', 'tres del mismo palo'],
    weight: 1,
    players: [
      { id: 'hero', name: 'Tú', cards: 'Ks Kd' },
      { id: 'ana', name: 'Ana' },
      { id: 'luis', name: 'Luis', cards: 'Qc Jc' },
      { id: 'marta', name: 'Marta' },
    ],
    button: 'hero',
    board: 'Ac 9c 4c 7d 2s',
    beats: [
      ...PREFLOP,
      {
        say: 'Salen as, nueve y cuatro de tréboles: el color ya está hecho y tú no tienes ni un trébol. Tu pareja de reyes vale mucho menos que en otro flop.',
        actions: [{ player: 'luis', type: 'check' as const }],
      },
      {
        say: 'Pasas atrás para controlar el bote: apostar grande solo consigue que te pague un color y que foldee lo que ibas ganando.',
        actions: [{ player: 'hero', type: 'check' as const }],
      },
      {
        say: 'El turn es un siete sin color: el peligro sigue intacto. Luis pasa y tú pasas atrás otra vez.',
        actions: [
          { player: 'luis', type: 'check' as const },
          { player: 'hero', type: 'check' as const },
        ],
      },
      {
        say: 'El river tampoco trae tréboles. Luis pasa, tú pasas y al enseñar se ve por qué controlaste: su dama jota de tréboles ya era color en el flop.',
        actions: [
          { player: 'luis', type: 'check' as const },
          { player: 'hero', type: 'check' as const },
        ],
        reveal: true,
      },
    ],
  },
]
