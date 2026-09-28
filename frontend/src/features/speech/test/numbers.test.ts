// ──────────────────────────────────────────────
// Números en palabras para la voz: las cifras del
// contenido (stacks, apuestas, porcentajes) se leen
// como números, no cifra a cifra.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { integerToSpanish, speakNumbers } from '../numbers'
import { cleanForSpeech } from '../lessonScript'

describe('integerToSpanish', () => {
  it.each([
    [0, 'cero'],
    [1, 'uno'],
    [16, 'dieciséis'],
    [21, 'veintiuno'],
    [25, 'veinticinco'],
    [31, 'treinta y uno'],
    [50, 'cincuenta'],
    [90, 'noventa'],
    [100, 'cien'],
    [101, 'ciento uno'],
    [125, 'ciento veinticinco'],
    [375, 'trescientos setenta y cinco'],
    [500, 'quinientos'],
    [1000, 'mil'],
    [1050, 'mil cincuenta'],
    [1200, 'mil doscientos'],
    [5000, 'cinco mil'],
    [21000, 'veintiún mil'],
    [100000, 'cien mil'],
    [1000000, 'un millón'],
    [2500000, 'dos millones quinientos mil'],
  ])('%i → %s', (n, words) => {
    expect(integerToSpanish(n)).toBe(words)
  })
})

describe('speakNumbers', () => {
  it('lee los miles con punto como un solo número', () => {
    expect(speakNumbers('Fíjate en el stack de Ana: solo 1.200.')).toBe(
      'Fíjate en el stack de Ana: solo mil doscientos.',
    )
    expect(speakNumbers('Stacks de 5.000 fichas')).toBe('Stacks de cinco mil fichas')
  })

  it('lee apuestas y botes', () => {
    expect(speakNumbers('Ana apuesta 50 en un bote de 200.')).toBe(
      'Ana apuesta cincuenta en un bote de doscientos.',
    )
    expect(speakNumbers('Subes a 125, y luego a 375.')).toBe('Subes a ciento veinticinco, y luego a trescientos setenta y cinco.')
  })

  it('lee decimales y porcentajes', () => {
    expect(speakNumbers('Abre a 2,5 ciegas')).toBe('Abre a dos coma cinco ciegas')
    expect(speakNumbers('un sizing de 2.5 BB')).toBe('un sizing de dos coma cinco BB')
    expect(speakNumbers('necesitas un 17 % de equity y tienes 36%')).toBe(
      'necesitas un diecisiete por ciento de equity y tienes treinta y seis por ciento',
    )
    expect(speakNumbers('0,25 del bote')).toBe('cero coma veinticinco del bote')
    expect(speakNumbers('un torneo de 10k')).toBe('un torneo de diez mil')
  })

  it('no toca los números pegados a letras ni el 3-bet', () => {
    expect(speakNumbers('A5s, un 3-bet, un 4bet')).toBe('A5s, un 3-bet, un 4bet')
  })
})

describe('guion de la clase', () => {
  it('pasa por palabras las cifras después de la notación de poker', () => {
    expect(cleanForSpeech('Con **1.200** fichas y 20bb, abre A5s.')).toBe(
      'Con mil doscientos fichas y veinte ciegas grandes, abre As cinco del mismo palo.',
    )
  })
})
