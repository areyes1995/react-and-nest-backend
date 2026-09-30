import { describe, expect, it } from 'vitest'
import { compile, derivative, evaluate, integral, intersections, limit, toFraction } from '../expr'

describe('expr', () => {
  it('respeta la precedencia y la multiplicación implícita', () => {
    expect(evaluate('2+3*4^2')).toBe(50)
    expect(evaluate('2(3+4)')).toBe(14)
    expect(evaluate('-2^2')).toBe(-4)
    expect(evaluate('2^3^2')).toBe(512)
    expect(evaluate('3x', { x: 2 })).toBe(6)
    expect(evaluate('2pi')).toBeCloseTo(2 * Math.PI)
  })

  it('evalúa funciones y modo de ángulo', () => {
    expect(evaluate('sin(30)', {}, 'DEG')).toBeCloseTo(0.5)
    expect(evaluate('sqrt(16)+log(100)+ln(e)')).toBeCloseTo(7)
    expect(evaluate('5!')).toBe(120)
    expect(evaluate('nroot(27,3)')).toBeCloseTo(3)
    expect(evaluate('(-8)^(1/3)')).toBeCloseTo(-2)
  })

  it('rechaza expresiones inválidas', () => {
    expect(() => evaluate('2+')).toThrow()
    expect(() => evaluate('(1+2')).toThrow()
    expect(() => evaluate('alert(1)')).toThrow()
  })

  it('compila funciones para graficar', () => {
    const f = compile('y = x^2 - 4')
    expect(f(3)).toBe(5)
    expect(Number.isNaN(compile('sqrt(x)')(-1))).toBe(true)
  })

  it('calcula derivadas, integrales, límites e intersecciones', () => {
    const f = compile('x^2')
    expect(derivative(f, 3)).toBeCloseTo(6, 4)
    expect(integral(f, 0, 3)).toBeCloseTo(9, 6)
    expect(limit(compile('sin(x)/x'), 0).value).toBeCloseTo(1, 4)
    const roots = intersections(compile('x^2'), compile('x+2'), -5, 5)
    expect(roots.map((r) => Number(r.toFixed(4)))).toEqual([-1, 2])
  })

  it('convierte decimales a fracción', () => {
    expect(toFraction(0.75)).toEqual({ num: 3, den: 4 })
    expect(toFraction(-1.5)).toEqual({ num: -3, den: 2 })
    expect(toFraction(Math.PI)).toBeNull()
  })
})
