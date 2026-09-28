import { describe, it, expect } from 'vitest'
import { splitIntoSteps, stepHoldsAudio } from '@components/guide/LessonStepper'
import type { ContentBlock } from '@features/academy/types'

const paragraph = (text: string): ContentBlock => ({ type: 'paragraph', text })
const heading = (text: string): ContentBlock => ({ type: 'heading', text })
const quiz = (): ContentBlock => ({
  type: 'quiz',
  questions: [
    { id: 'q1', question: '¿Sí?', options: ['a', 'b'], answerIndex: 0, explanation: 'Porque sí.' },
  ],
})
const spot = (): ContentBlock => ({
  type: 'spot',
  hole: 'Ah Qd',
  board: 'Ad 7s 4h',
  question: '¿Qué tienes?',
  answer: 'Pareja de ases.',
})
const drill = (): ContentBlock => ({ type: 'drill', seats: 6, goal: 'Juega 20 manos', hands: 20 })
const table = (): ContentBlock => ({ type: 'table', headers: ['A'], rows: [['b']] })

describe('splitIntoSteps', () => {
  it('abre un paso nuevo en cada encabezado', () => {
    const steps = splitIntoSteps([
      heading('Posición'),
      paragraph('Actuar el último es una ventaja.'),
      heading('Rangos'),
      paragraph('Un rango es el conjunto de manos posibles.'),
    ])
    expect(steps.map(step => step.title)).toEqual(['Posición', 'Rangos'])
    expect(steps[0].blocks).toHaveLength(1)
  })

  it('agrupa bajo «Introducción» lo que va antes del primer encabezado', () => {
    const steps = splitIntoSteps([
      paragraph('Antes de empezar.'),
      heading('Posición'),
      paragraph('Actuar el último es una ventaja.'),
    ])
    expect(steps.map(step => step.title)).toEqual(['Introducción', 'Posición'])
  })

  it('aísla el test en su propio paso', () => {
    const steps = splitIntoSteps([heading('Pot odds'), paragraph('El precio de seguir.'), quiz()])
    expect(steps).toHaveLength(2)
    expect(steps[1].isQuiz).toBe(true)
    expect(steps[1].blocks).toHaveLength(1)
  })

  it('el contenido posterior a un test no se cuela en el paso del test', () => {
    const steps = splitIntoSteps([quiz(), paragraph('Un cierre después del test.')])
    expect(steps).toHaveLength(2)
    expect(steps[0].isQuiz).toBe(true)
    expect(steps[1].title).toBe('Introducción')
    expect(steps[1].isQuiz).toBe(false)
  })

  it('una clase sin encabezados queda en un solo paso', () => {
    const steps = splitIntoSteps([paragraph('Uno.'), paragraph('Dos.')])
    expect(steps).toHaveLength(1)
    expect(steps[0].blocks).toHaveLength(2)
  })

  it('descarta encabezados sin contenido detrás', () => {
    const steps = splitIntoSteps([heading('Vacío'), heading('Con texto'), paragraph('Algo.')])
    expect(steps.map(step => step.title)).toEqual(['Con texto'])
  })

  it('no pierde ningún bloque por el camino', () => {
    const blocks = [paragraph('a'), heading('H'), paragraph('b'), quiz(), paragraph('c')]
    const total = splitIntoSteps(blocks).reduce((sum, step) => sum + step.blocks.length, 0)
    expect(total).toBe(blocks.length - 1) // el encabezado se convierte en título
  })
})

describe('stepHoldsAudio', () => {
  it('retiene el audio si el paso trae test, situación o ejercicio', () => {
    expect(stepHoldsAudio(splitIntoSteps([quiz()])[0])).toBe(true)
    expect(stepHoldsAudio(splitIntoSteps([heading('H'), paragraph('Lee.'), spot()])[0])).toBe(true)
    expect(stepHoldsAudio(splitIntoSteps([heading('H'), paragraph('Lee.'), drill()])[0])).toBe(true)
  })

  it('deja avanzar si el paso solo trae texto y tablas', () => {
    expect(stepHoldsAudio(splitIntoSteps([heading('H'), paragraph('Lee.'), table()])[0])).toBe(false)
    expect(stepHoldsAudio(undefined)).toBe(false)
  })
})
