import {
  lessonPlanTemplate,
  normalizeRubricWeights,
  programTemplate,
  rubricTemplate,
} from '../../ai-pedagogy/generators/pedagogy-templates';
import {
  scoreInstrument,
  validateInstrumentContent,
} from '../dto/instrument-content';

const rubric = {
  levels: ['Excelente', 'Logrado', 'En proceso', 'Inicio'],
  scores: [4, 3, 2, 1],
  criteria: [
    { criterion: 'Uno', weight: 40, descriptors: ['a', 'b', 'c', 'd'] },
    { criterion: 'Dos', weight: 60, descriptors: ['a', 'b', 'c', 'd'] },
  ],
};

describe('contenido de instrumentos', () => {
  it('acepta instrumentos bien formados', () => {
    expect(validateInstrumentContent('RUBRIC', rubric).ok).toBe(true);
    expect(
      validateInstrumentContent('CHECKLIST', { items: [{ text: 'Observa' }] })
        .ok,
    ).toBe(true);
    expect(
      validateInstrumentContent('RATING_SCALE', {
        scale: '1-4',
        levels: Array.from({ length: 4 }, (_, i) => ({
          value: String(4 - i),
          label: `N${i}`,
        })),
        items: [{ text: 'Aspecto' }],
      }).ok,
    ).toBe(true);
  });

  it('rechaza pesos, niveles y criterios mal formados', () => {
    expect(
      validateInstrumentContent('RUBRIC', {
        ...rubric,
        criteria: [rubric.criteria[0]],
      }).ok,
    ).toBe(false);
    expect(
      validateInstrumentContent('RUBRIC', { ...rubric, levels: ['A', 'B'] }).ok,
    ).toBe(false);
    expect(validateInstrumentContent('CHECKLIST', { items: [] }).ok).toBe(
      false,
    );
  });

  it('calcula la nota a partir de las marcas', () => {
    expect(
      scoreInstrument('RUBRIC', rubric, { levels: { 0: 0, 1: 2 } }, 100).score,
    ).toBe(70);
    expect(
      scoreInstrument(
        'CHECKLIST',
        { items: [{ text: 'a' }, { text: 'b' }] },
        { checked: [0, 1] },
        100,
      ).score,
    ).toBe(100);
    expect(
      scoreInstrument('RUBRIC', rubric, { levels: { 0: 9 } }, 100).error,
    ).toBeDefined();
  });
});

describe('plantillas pedagógicas', () => {
  it('reparte los minutos sin perder el total ni dejar momentos de 5 en 45', () => {
    for (const duration of [12, 30, 45, 60]) {
      const minutes = lessonPlanTemplate({
        topic: 'fracciones',
        durationMinutes: duration,
      }).moments.map((m) => m.minutes);
      expect(minutes.reduce((a, b) => a + b, 0)).toBe(duration);
      if (duration >= 30)
        expect(Math.min(...minutes)).toBeGreaterThanOrEqual(10);
      if (duration === 45) expect(minutes).not.toContain(5);
    }
  });

  it('normaliza los pesos de una rúbrica a 100', () => {
    const normalized = normalizeRubricWeights([
      { criterion: 'a', weight: 25 },
      { criterion: 'b', weight: 25 },
      { criterion: 'c', weight: 25 },
    ]);
    expect(normalized.reduce((sum, c) => sum + c.weight, 0)).toBe(100);
    expect(
      rubricTemplate('fracciones', undefined, 5).content.criteria.reduce(
        (sum, c) => sum + c.weight,
        0,
      ),
    ).toBe(100);
  });

  it('usa solo competencias, indicadores y criterios entregados', () => {
    const draft = programTemplate({
      gradeName: '2º',
      concepts: [{ id: 1, block: 'Números', description: 'Fracciones' }],
      periods: [{ number: 1, startDate: '2026-01-01', endDate: '2026-03-01' }],
      competences: [{ id: 7, name: 'Comprensión' }],
      indicators: [{ id: 9, description: 'Identifica fracciones' }],
      evaluationCriteria: ['Criterio propio'],
    });
    expect(draft.units[0].specificCompetenceIds).toEqual([7]);
    expect(draft.units[0].indicatorIds).toEqual([9]);
    expect(draft.units[0].evaluationCriteria).toEqual(['Criterio propio']);
    const fallback = programTemplate({
      gradeName: '2º',
      concepts: [{ id: 1, block: 'Números', description: 'Fracciones' }],
      periods: [],
    });
    expect(fallback.units[0].specificCompetenceIds).toEqual([]);
    expect(fallback.units[0].indicatorIds).toEqual([]);
    expect(fallback.units[0].evaluationCriteria).toEqual([]);
  });
});
