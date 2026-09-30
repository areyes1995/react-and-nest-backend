import {
  effectiveScore,
  summarizeStudent,
  weightedActivityScore,
  type PeriodEntry,
} from '../grading.calculator';

function fullYear(score: number): PeriodEntry[] {
  const entries: PeriodEntry[] = [];
  for (let block = 1; block <= 4; block++) {
    for (let period = 1; period <= 4; period++) {
      entries.push({ block, period, score, recovery: null });
    }
  }
  return entries;
}

describe('grading.calculator', () => {
  it('usa la mayor nota entre P y RP', () => {
    expect(effectiveScore(60, 75)).toBe(75);
    expect(effectiveScore(80, 70)).toBe(80);
    expect(effectiveScore(null, 65)).toBe(65);
    expect(effectiveScore(null, null)).toBeNull();
  });

  it('calcula PC y C.F. redondeados y aprueba con 70', () => {
    const s = summarizeStudent(fullYear(85), null);
    expect(s.blockAverages[1]).toBe(85);
    expect(s.finalScore).toBe(85);
    expect(s.situation).toBe('A');
  });

  it('queda pendiente de completiva cuando C.F. < 70', () => {
    const s = summarizeStudent(fullYear(60), null);
    expect(s.finalScore).toBe(60);
    expect(s.situation).toBe('PENDIENTE');
  });

  it('aprueba en completiva con 50% C.F. + 50% C.E.C.', () => {
    const s = summarizeStudent(fullYear(60), {
      completiveScore: 80,
      extraordinaryScore: null,
      specialScore: null,
    });
    expect(s.completiveFinal).toBe(70);
    expect(s.situation).toBe('A');
  });

  it('aplica extraordinaria 30/70 y reprueba en especial', () => {
    const s = summarizeStudent(fullYear(50), {
      completiveScore: 60,
      extraordinaryScore: 70,
      specialScore: 10,
    });
    expect(s.completiveFinal).toBe(55);
    expect(s.extraordinaryFinal).toBe(64);
    expect(s.specialTotal).toBe(60);
    expect(s.situation).toBe('R');
  });

  it('ignora periodos sin nota al promediar', () => {
    const s = summarizeStudent(
      [
        { block: 1, period: 1, score: 90, recovery: null },
        { block: 1, period: 2, score: 70, recovery: null },
      ],
      null,
    );
    expect(s.blockAverages[1]).toBe(80);
    expect(s.blockAverages[2]).toBeNull();
    expect(s.finalScore).toBe(80);
    expect(s.periodAverages[1]).toBe(90);
  });

  it('pondera las actividades sobre base 100', () => {
    expect(
      weightedActivityScore([
        { score: 8, maxScore: 10, weight: 1 },
        { score: 45, maxScore: 50, weight: 2 },
        { score: null, maxScore: 10, weight: 1 },
      ]),
    ).toBe(86.7);
    expect(weightedActivityScore([])).toBeNull();
  });
});
