import { solveStepByStep } from '../math/step-solver';

describe('solveStepByStep', () => {
  it('resuelve 2x + 5 = 13 como en la especificación', () => {
    const s = solveStepByStep('2x + 5 = 13');
    expect(s.kind).toBe('linear');
    expect(s.answer).toBe('x = 4');
    expect(s.steps.map((p) => p.explanation)).toEqual([
      'Restar 5 en ambos lados.',
      'Dividir entre 2 en ambos lados.',
      'Verificación: sustituir x = 4 en la ecuación original.',
    ]);
    expect(s.steps[0].latex).toBe('2x = 8');
    expect(s.steps[1].latex).toBe('x = 4');
  });

  it('reúne variables en ambos lados y simplifica paréntesis', () => {
    const s = solveStepByStep('3(x - 2) = x + 4');
    expect(s.answer).toBe('x = 5');
  });

  it('trabaja con fracciones exactas', () => {
    expect(solveStepByStep('x/2 + 1/3 = 1').answer).toBe('x = 4/3');
  });

  it('detecta identidades y ecuaciones sin solución', () => {
    expect(solveStepByStep('2x + 2 = 2(x + 1)').kind).toBe('identity');
    expect(solveStepByStep('x + 1 = x + 2').kind).toBe('no-solution');
  });

  it('resuelve cuadráticas con la fórmula general', () => {
    const s = solveStepByStep('x^2 - 5x + 6 = 0');
    expect(s.kind).toBe('quadratic');
    expect(s.answer).toBe('x₁ = 3, x₂ = 2');
  });

  it('resuelve sistemas 2x2 por reducción', () => {
    const s = solveStepByStep('2x + y = 7; x - y = 2');
    expect(s.kind).toBe('system');
    expect(s.answer).toBe('x = 3, y = 1');
  });

  it('simplifica expresiones', () => {
    expect(solveStepByStep('3(x + 2) - x').answer).toBe('2x + 6');
  });

  it('rechaza entradas inválidas', () => {
    expect(() => solveStepByStep('2x + = 3')).toThrow();
  });
});
