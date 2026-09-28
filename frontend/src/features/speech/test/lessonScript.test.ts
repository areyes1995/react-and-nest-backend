import { describe, it, expect } from 'vitest'
import {
  blockToSpeech,
  chunkForSpeech,
  cleanForSpeech,
  esPhonetics,
  speakCard,
  speakCards,
  speakPoker,
  tableRowForChunk,
  tableRowSpeeches,
} from '@features/speech/lessonScript'
import type { ContentBlock } from '@features/academy/types'
import { isLatamVoice, rankSpanishVoices } from '@features/speech/useReadAloud'

describe('speakCard', () => {
  it('dice el nombre de la carta en español', () => {
    expect(speakCard('As')).toBe('As de picas')
    expect(speakCard('Kh')).toBe('Rey de corazones')
    expect(speakCard('Td')).toBe('Diez de diamantes')
    expect(speakCard('7c')).toBe('7 de tréboles')
  })

  it('deja tal cual lo que no es una carta', () => {
    expect(speakCard('xx')).toBe('xx')
  })

  it('une varias cartas con "y"', () => {
    expect(speakCards('As Kh')).toBe('As de picas y Rey de corazones')
    expect(speakCards('Qd Jd 2c')).toBe('Dama de diamantes, Jota de diamantes y 2 de tréboles')
  })
})

describe('speakPoker: la notación se dice con palabras', () => {
  it('manos iniciales y rangos', () => {
    expect(speakPoker('AJs+ y 77+')).toBe('As Jota del mismo palo o superior y sietes o superior')
    expect(speakPoker('KTo, QQ+, AK')).toBe('Rey Diez de distinto palo, damas o superior, As Rey')
    expect(speakPoker('A5s-A2s')).toBe('de As 5 del mismo palo a As 2 del mismo palo')
    expect(speakPoker('22-JJ')).toBe('de doses a jotas')
  })

  it('no confunde números con parejas', () => {
    expect(speakPoker('Juega 22 manos')).toBe('Juega 22 manos')
    expect(speakPoker('25-33% del bote')).toBe('de 25 a 33% del bote')
    expect(speakPoker('3-bet y 4-bet')).toBe('3-bet y 4-bet')
  })

  it('las parejas en contexto de mano se dicen cifra a cifra', () => {
    expect(speakPoker('77 UTG abre siempre')).toBe('7 7 U-T-G abre siempre')
    expect(speakPoker('77 en UTG es fold')).toBe('7 7 en U-T-G es fold')
    expect(speakPoker('Manos como AJo, KQo o 99')).toBe('Manos como As Jota de distinto palo, Rey Dama de distinto palo o 9 9')
    expect(speakPoker('Sets (88, 44)')).toBe('Sets (8 8, 4 4)')
    expect(speakPoker('Juega 22 manos y 77+')).toBe('Juega 22 manos y sietes o superior')
    expect(speakPoker('33-50% del bote')).toBe('33 a 50% del bote')
  })

  it('el inglés de póker se escribe como suena en cualquier idioma', () => {
    expect(speakPoker('El rake se come tu winrate')).toBe('El reik se come tu winrate')
    expect(speakPoker('Calcula tu equity')).toBe('Calcula tu ekuiti')
    expect(speakPoker('Va all-in por 1.200')).toBe('Va ol-in por 1.200')
    expect(speakPoker('Apuesta de value')).toBe('Apuesta de valiu')
    expect(speakPoker('Gestiona tu bankroll')).toBe('Gestiona tu bancrol')
    expect(speakPoker('El squeeze')).toBe('El scuiz')
    expect(speakPoker('Ligas top pair')).toBe('Ligas top per')
    expect(speakPoker('Overpair contra proyecto')).toBe('Over per contra proyecto')
    expect(speakPoker('Sube a 150, iguala el call')).toBe('Sube a 150, iguala el kol')
    expect(speakPoker('Muchos calls de precio justo')).toBe('Muchos kols de precio justo')
    expect(speakPoker('Contra calling stations')).toBe('Contra kolin stations')
    expect(speakPoker('Overbets y river raises')).toBe('Overbets y river reises')
    expect(speakPoker('Abrir con open raise a 125')).toBe('Abrir con open reis a 125')
    expect(speakPoker('Necesitas check-raises con valor')).toBe('Necesitas check-reises con valor')
    expect(speakPoker('Min-raise a 100')).toBe('Min-reis a 100')
  })

  it('lo que ya suena bien no se toca', () => {
    expect(speakPoker('Llega al showdown')).toBe('Llega al showdown')
    expect(speakPoker('Un buen bluff')).toBe('Un buen bluff')
    expect(speakPoker('En el cutoff')).toBe('En el cutoff')
  })

  it('fonética solo-español: hijack, holdem y outs se dicen como suenan', () => {
    expect(esPhonetics('Después viene Sofía, en el hijack')).toBe('Después viene Sofía, en el jaiyack')
    expect(esPhonetics("El Texas Hold'em es un juego")).toBe('El Texas jóldem es un juego')
    expect(esPhonetics('Juegas al holdem online')).toBe('Juegas al jóldem online')
    expect(esPhonetics('Quedan nueve outs en la baraja')).toBe('Quedan nueve auts en la baraja')
    expect(esPhonetics('Un out es una carta que te ayuda')).toBe('Un aut es una carta que te ayuda')
    expect(esPhonetics('El torneo es knockout')).toBe('El torneo es knockout')
    expect(esPhonetics('Marta es UTG')).toBe('Marta es UTG')
  })

  it('cartas con símbolo, boards y manos con guion', () => {
    expect(speakPoker('K♠ K♥ 7♦')).toBe('Rey de picas, Rey de corazones, 7 de diamantes')
    expect(speakPoker('Tienes 7♠7♥')).toBe('Tienes 7 de picas, 7 de corazones')
    expect(speakPoker('Flop K-7-2 con A-K')).toBe('Flop Rey 7 2 con As Rey')
    expect(speakPoker('3-4 veces')).toBe('3 a 4 veces')
  })

  it('siglas, unidades, fracciones y comparaciones', () => {
    expect(speakPoker('Gana 4 bb/100')).toBe('Gana 4 ciegas grandes cada cien manos')
    expect(speakPoker('IP vs OOP')).toBe('en posición contra fuera de posición')
  })

  it('deletrea la sigla entre paréntesis para no repetir el nombre', () => {
    expect(cleanForSpeech('Estar **en posición (IP)** es actuar el último.')).toBe('Estar en posición (I-P) es actuar el último.')
    expect(cleanForSpeech('Estar **fuera de posición (OOP)** es actuar antes.')).toBe('Estar fuera de posición (O-O-P) es actuar antes.')
    expect(cleanForSpeech('El botón (BTN), la ciega pequeña (SB) y la ciega grande (BB).')).toBe(
      'El botón (B-T-N), la ciega pequeña (S-B) y la ciega grande (B-B).',
    )
    // Fuera de paréntesis la sigla se sigue diciendo con palabras.
    expect(cleanForSpeech('Juega IP y evita botes grandes OOP.')).toBe('Juega en posición y evita botes grandes fuera de posición.')
    expect(cleanForSpeech('Apuesta ½ bote, ¾ o ⅓.')).toBe('Apuesta medio bote, tres cuartos o un tercio.')
    expect(speakPoker('2,5x la apuesta')).toBe('2,5 veces la apuesta')
    expect(speakPoker('Fold >55%, ~36%')).toBe('Fold más de 55%, aproximadamente 36%')
    expect(speakPoker('+EV y -EV')).toBe('EV positivo y EV negativo')
  })
})

describe('blockToSpeech', () => {
  it('quita la negrita y cierra la frase', () => {
    expect(blockToSpeech({ type: 'paragraph', text: 'La **posición** manda' })).toBe('La posición manda.')
    expect(cleanForSpeech('preflop → flop · turn')).toBe('preflop, flop, turn')
  })

  it('lee la situación sin revelar la respuesta', () => {
    const text = blockToSpeech({ type: 'spot', hole: 'As Ah', board: 'Kd 7c 2h', question: '¿Apuestas?', answer: 'Sí, por valor' })
    expect(text).toContain('Tu mano: As de picas y As de corazones.')
    expect(text).toContain('En la mesa: Rey de diamantes, 7 de tréboles y 2 de corazones.')
    expect(text).not.toContain('por valor')
  })

  it('lee las opciones del test pero no la correcta ni la explicación', () => {
    const text = blockToSpeech({
      type: 'quiz',
      questions: [{ id: 'q', question: '¿Cuántas cartas?', options: ['Dos', 'Cinco'], answerIndex: 1, explanation: 'Porque sí' }],
    })
    expect(text).toContain('Opción 1: Dos.')
    expect(text).toContain('Opción 2: Cinco.')
    expect(text).not.toContain('Porque sí')
  })

  it('la voz omite las URLs en vez de deletrearlas', () => {
    expect(cleanForSpeech('Más info en https://piosolver.com/.')).toBe('Más info en')
    expect(blockToSpeech({ type: 'paragraph', text: 'Web https://gtowizard.com/ y sigue.' })).toBe(
      'Web y sigue.',
    )
  })

  it('lee las tablas fila a fila con su cabecera', () => {
    const text = blockToSpeech({ type: 'table', headers: ['Mano', 'Fuerza'], rows: [['Pareja', 'Baja']] })
    expect(text).toBe('Tabla. Pareja, Fuerza: Baja.')
  })
})

describe('tableRowForChunk: la fila que explica el audio', () => {
  const table: Extract<ContentBlock, { type: 'table' }> = {
    type: 'table',
    headers: ['Calle', 'Cartas'],
    rows: [
      ['Flop', 'Tres cartas'],
      ['Turn', 'Una carta'],
      ['River', 'Una carta'],
    ],
  }

  it('dice cada fila con su cabecera', () => {
    expect(tableRowSpeeches(table)).toEqual([
      'Flop, Cartas: Tres cartas.',
      'Turn, Cartas: Una carta.',
      'River, Cartas: Una carta.',
    ])
  })

  it('el prefijo "Tabla." no marca ninguna fila y cada trozo marca la suya', () => {
    expect(tableRowForChunk(table, null)).toBeNull()
    expect(tableRowForChunk(table, 0)).toBeNull()
    expect(tableRowForChunk(table, 1)).toBe(0)
    expect(tableRowForChunk(table, 2)).toBe(1)
    expect(tableRowForChunk(table, 3)).toBe(2)
  })

  it('un trozo más allá del final se queda en la última fila', () => {
    expect(tableRowForChunk(table, 99)).toBe(2)
  })

  it('una fila larga partida en varios trozos sigue marcando esa fila', () => {
    const long: Extract<ContentBlock, { type: 'table' }> = {
      type: 'table',
      headers: ['Idea'],
      rows: [[Array.from({ length: 30 }, (_, i) => `trozo ${i}`).join(', ') + '.']],
    }
    const speech = tableRowSpeeches(long)[0]
    const count = chunkForSpeech(speech).length
    expect(count).toBeGreaterThan(1)
    for (let chunk = 1; chunk <= count; chunk++) {
      expect(tableRowForChunk(long, chunk)).toBe(0)
    }
  })
})

describe('chunkForSpeech', () => {
  it('corta por frases sin partir los decimales', () => {
    expect(chunkForSpeech('Sube a 2.5 BB. Luego paga.')).toEqual(['Sube a 2.5 BB.', 'Luego paga.'])
  })

  it('parte por comas las frases demasiado largas', () => {
    const long = Array.from({ length: 30 }, (_, i) => `trozo ${i}`).join(', ') + '.'
    const chunks = chunkForSpeech(long, 60)
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.every(chunk => chunk.length <= 60)).toBe(true)
    expect(chunks.join(' ')).toBe(long)
  })
})

describe('elección de voz', () => {
  const voices = [
    { name: 'Microsoft Helena - Spanish (Spain)', lang: 'es-ES' },
    { name: 'Microsoft David - English', lang: 'en-US' },
    { name: 'Google español de Estados Unidos', lang: 'es-US' },
    { name: 'Microsoft Sabina - Spanish (Mexico)', lang: 'es-MX' },
    { name: 'Microsoft Dalia Online (Natural) - Spanish (Mexico)', lang: 'es-MX' },
  ]

  it('prefiere voces latinoamericanas naturales y deja España al final', () => {
    const ranked = rankSpanishVoices(voices).map(v => v.name)
    expect(ranked[0]).toContain('Dalia')
    expect(ranked[ranked.length - 1]).toContain('Helena')
    expect(ranked.some(name => name.includes('English'))).toBe(false)
  })

  it('reconoce las variantes latinoamericanas', () => {
    expect(isLatamVoice({ lang: 'es_MX' })).toBe(true)
    expect(isLatamVoice({ lang: 'es-419' })).toBe(true)
    expect(isLatamVoice({ lang: 'es-ES' })).toBe(false)
  })
})
