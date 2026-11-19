import {
  ACHIEVEMENT_THRESHOLDS,
  EXTRAORDINARY_FORMULA,
  achievementLevel,
  isGradableScore,
  resolveGradingScale,
  scaleValueFromInternal,
  scaleValueToInternal,
  summarizeStudent,
  weightedActivityScore,
} from '../shared/grading.calculator';

describe('escalas de calificación', () => {
  it('conserva el comportamiento 0-100 por defecto', () => {
    const scale = resolveGradingScale(null);
    expect(scale).toEqual({ type: 'NUMERIC_100', passing: 70 });
    expect(scaleValueToInternal(73.5, scale)).toBe(73.5);
    expect(scaleValueFromInternal(73.5, scale)).toBe(73.5);
  });

  it('normaliza 1-5 y 1-4 al modelo interno y viceversa', () => {
    expect(scaleValueToInternal(4, 'NUMERIC_1_5')).toBe(80);
    expect(scaleValueFromInternal(80, 'NUMERIC_1_5')).toBe(4);
    expect(scaleValueToInternal(3, 'NUMERIC_1_4')).toBe(75);
    expect(scaleValueFromInternal(75, 'NUMERIC_1_4')).toBe(3);
  });

  it('codifica la escala literal como 4/3/2/1 en la BD', () => {
    expect(scaleValueToInternal(4, 'LITERAL')).toBe(95);
    expect(scaleValueToInternal(2, 'LITERAL')).toBe(70);
    expect(scaleValueFromInternal(95, 'LITERAL')).toBe(4);
    expect(scaleValueFromInternal(0, 'LITERAL')).toBe(1);
  });
});

describe('política de puntuaciones ponderadas', () => {
  it('excluye null pero cuenta el cero explícito', () => {
    expect(isGradableScore(0)).toBe(true);
    expect(isGradableScore(null)).toBe(false);
    expect(isGradableScore(undefined)).toBe(false);
    expect(
      weightedActivityScore([
        { score: 0, maxScore: 10, weight: 1 },
        { score: 10, maxScore: 10, weight: 1 },
        { score: null, maxScore: 10, weight: 1 },
      ]),
    ).toBe(50);
  });
});

describe('constantes compartidas', () => {
  it('usa la extraordinaria 30/70 y los umbrales de logro de la calculadora', () => {
    expect(EXTRAORDINARY_FORMULA).toBe('ORDENANZA_30_70');
    expect(ACHIEVEMENT_THRESHOLDS.EXCELENTE).toBe(90);
    expect(achievementLevel(90)).toBe('EXCELENTE');
    const entries = Array.from({ length: 4 }, (_, b) =>
      Array.from({ length: 4 }, (_, p) => ({
        block: b + 1,
        period: p + 1,
        score: 50,
        recovery: null,
      })),
    ).flat();
    const summary = summarizeStudent(entries, {
      completiveScore: 60,
      extraordinaryScore: 70,
      specialScore: null,
    });
    expect(summary.completiveFinal).toBe(55);
    expect(summary.extraordinaryFinal).toBe(64);
  });
});
