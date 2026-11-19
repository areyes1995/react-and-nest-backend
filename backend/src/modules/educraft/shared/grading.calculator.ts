// ──────────────────────────────────────────────
// Cálculo del registro oficial de calificaciones
// (plantilla "Plantilla de boletín y récord de notas").
//
//   • Cada bloque de competencias (PC1…PC4) tiene 4
//     periodos P1…P4 con su recuperación RP. La nota
//     efectiva de un periodo es la mayor entre P y RP.
//   • PCn = promedio redondeado de los periodos con nota.
//   • C.F. = ROUND(AVERAGE(PC1:PC4), 0).
//   • Si C.F. < 70 → completiva: C.C.F. = 50% C.F. + 50% C.E.C.
//   • Si C.C.F. < 70 → extraordinaria:
//       C.EX.F. = 30% C.F. + 70% C.E.EX (encabezado de la plantilla;
//       la celda AX multiplica por 0.5, se sigue el encabezado y la
//       Ordenanza 1'96).
//   • Si C.EX.F. < 70 → especial: aprueba si C.F. + C.E. ≥ 70
//     (fórmula BB/BC de la plantilla).
//
// Modelo interno: todas las operaciones usan 0-100. La escala declarada por
// el año escolar sólo se aplica al cruzar la frontera de la API.
// ──────────────────────────────────────────────

export const GRADING_BLOCKS = [
  { block: 1, code: 'PC1', name: 'Competencia comunicativa' },
  {
    block: 2,
    code: 'PC2',
    name: 'Pensamiento lógico, creativo y resolución de problemas',
  },
  { block: 3, code: 'PC3', name: 'Ética y ciudadanía - desarrollo personal' },
  {
    block: 4,
    code: 'PC4',
    name: 'Científica y tecnológica - ambiental y de la salud',
  },
] as const;

export const PERIODS = [1, 2, 3, 4] as const;
export const DEFAULT_PASSING_SCORE = 70;

/** Umbral de logro compartido con la interfaz (`labels.ts`). */
export const ACHIEVEMENT_THRESHOLDS = {
  EXCELENTE: 90,
  EN_PROCESO_MARGIN: 10,
} as const;

export type ExtraordinaryFormula = 'ORDENANZA_30_70' | 'WORKBOOK_50_50';

/**
 * Conflicto documentado del libro de cálculo: el encabezado y la Ordenanza 1'96
 * definen la extraordinaria como 30% C.F. + 70% C.E.EX, pero la celda AX del
 * workbook aplica 0.5 × C.F. + 0.5 × C.E.EX. Se conserva el comportamiento
 * vigente (30/70); cambiar esta constante a WORKBOOK_50_50 aplica la celda AX.
 */
export const EXTRAORDINARY_FORMULA: ExtraordinaryFormula = 'ORDENANZA_30_70';

const EXTRAORDINARY_WEIGHTS: Record<
  ExtraordinaryFormula,
  { final: number; exam: number }
> = {
  ORDENANZA_30_70: { final: 0.3, exam: 0.7 },
  WORKBOOK_50_50: { final: 0.5, exam: 0.5 },
};

export const GRADING_SCALE_TYPES = [
  'NUMERIC_100',
  'NUMERIC_1_5',
  'NUMERIC_1_4',
  'LITERAL',
] as const;
export type GradingScaleType = (typeof GRADING_SCALE_TYPES)[number];

export interface GradingScale {
  type: GradingScaleType;
  /** Nota mínima expresada en la escala declarada (70 en 0-100, 3 en 1-5…). */
  passing: number;
}

export const DEFAULT_GRADING_SCALE: GradingScale = {
  type: 'NUMERIC_100',
  passing: DEFAULT_PASSING_SCORE,
};

export function resolveGradingScale(raw: unknown): GradingScale {
  const value =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const type = GRADING_SCALE_TYPES.includes(value.type as GradingScaleType)
    ? (value.type as GradingScaleType)
    : DEFAULT_GRADING_SCALE.type;
  const passing =
    typeof value.passing === 'number' &&
    Number.isFinite(value.passing) &&
    value.passing >= 0 &&
    value.passing <= 100
      ? value.passing
      : DEFAULT_GRADING_SCALE.passing;
  return { type, passing };
}

/**
 * La BD guarda Float, por eso A/B/C/D se codifican como 4/3/2/1. Los anclajes
 * internos (A=95, B=85, C=70, D=50) hacen que "C" equivalga a la nota mínima
 * por defecto; la conversión inversa usa el anclaje más cercano.
 */
export const LITERAL_GRADES = [
  { code: 1, label: 'D', internal: 50 },
  { code: 2, label: 'C', internal: 70 },
  { code: 3, label: 'B', internal: 85 },
  { code: 4, label: 'A', internal: 95 },
] as const;

const round = (n: number) => Math.round(n);
const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const scaleTypeOf = (
  scale: GradingScale | GradingScaleType,
): GradingScaleType => (typeof scale === 'string' ? scale : scale.type);

/** Convierte un valor de la escala declarada al modelo interno 0-100. */
export function scaleValueToInternal(
  value: number | null | undefined,
  scale: GradingScale | GradingScaleType,
): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  // 1…5 → 20…100 y 1…4 → 25…100: reparto lineal del rango declarado.
  switch (scaleTypeOf(scale)) {
    case 'NUMERIC_1_5':
      return round1(clamp(value * 20, 0, 100));
    case 'NUMERIC_1_4':
      return round1(clamp(value * 25, 0, 100));
    case 'LITERAL':
      return (
        LITERAL_GRADES.find((g) => g.code === Math.round(value))?.internal ??
        null
      );
    default:
      return round1(clamp(value, 0, 100));
  }
}

/** Convierte un valor interno 0-100 a la escala declarada para su presentación. */
export function scaleValueFromInternal(
  value: number | null | undefined,
  scale: GradingScale | GradingScaleType,
): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  switch (scaleTypeOf(scale)) {
    case 'NUMERIC_1_5':
      return round1(clamp(value / 20, 1, 5));
    case 'NUMERIC_1_4':
      return round1(clamp(value / 25, 1, 4));
    case 'LITERAL': {
      let closest: { code: number; internal: number } = LITERAL_GRADES[0];
      for (const grade of LITERAL_GRADES) {
        if (
          Math.abs(grade.internal - value) < Math.abs(closest.internal - value)
        )
          closest = grade;
      }
      return closest.code;
    }
    default:
      return round1(clamp(value, 0, 100));
  }
}

/** Nota mínima convertida al modelo interno (70 por defecto, sin cambios en 0-100). */
export function internalPassing(scale: GradingScale): number {
  return scaleValueToInternal(scale.passing, scale) ?? DEFAULT_PASSING_SCORE;
}

export type FinalSituation = 'A' | 'R' | 'PENDIENTE';

export interface PeriodEntry {
  period: number;
  block: number;
  score: number | null;
  recovery: number | null;
}

export interface FinalEntry {
  completiveScore: number | null;
  extraordinaryScore: number | null;
  specialScore: number | null;
}

export interface StudentGradeSummary {
  /** Nota efectiva por bloque y periodo: blocks[block][period]. */
  effective: Record<number, Record<number, number | null>>;
  /** PC1…PC4. */
  blockAverages: Record<number, number | null>;
  /** Promedio de los 4 bloques en cada periodo (para gráficos). */
  periodAverages: Record<number, number | null>;
  finalScore: number | null; // C.F.
  completiveFinal: number | null; // C.C.F.
  extraordinaryFinal: number | null; // C.EX.F.
  specialTotal: number | null; // C.F. + C.E.
  situation: FinalSituation;
}

/** Política explícita: null/omitido se excluye; cero es una nota válida y cuenta. */
export function isGradableScore(
  score: number | null | undefined,
): score is number {
  return typeof score === 'number' && Number.isFinite(score);
}

function average(values: Array<number | null | undefined>): number | null {
  const list = values.filter(isGradableScore);
  if (list.length === 0) return null;
  return list.reduce((a, b) => a + b, 0) / list.length;
}

export function effectiveScore(
  score: number | null,
  recovery: number | null,
): number | null {
  if (score == null && recovery == null) return null;
  if (score == null) return recovery;
  if (recovery == null) return score;
  return Math.max(score, recovery);
}

export function summarizeStudent(
  entries: PeriodEntry[],
  final: FinalEntry | null,
  passing = DEFAULT_PASSING_SCORE,
): StudentGradeSummary {
  const effective: StudentGradeSummary['effective'] = {};
  for (const { block } of GRADING_BLOCKS) {
    effective[block] = {};
    for (const period of PERIODS) effective[block][period] = null;
  }
  for (const e of entries) {
    if (!effective[e.block] || !(e.period in effective[e.block])) continue;
    effective[e.block][e.period] = effectiveScore(e.score, e.recovery);
  }

  const blockAverages: Record<number, number | null> = {};
  for (const { block } of GRADING_BLOCKS) {
    const avg = average(PERIODS.map((p) => effective[block][p]));
    blockAverages[block] = avg == null ? null : round(avg);
  }

  const periodAverages: Record<number, number | null> = {};
  for (const period of PERIODS) {
    const avg = average(
      GRADING_BLOCKS.map(({ block }) => effective[block][period]),
    );
    periodAverages[period] = avg == null ? null : round1(avg);
  }

  const cfAvg = average(Object.values(blockAverages));
  const finalScore = cfAvg == null ? null : round(cfAvg);

  let completiveFinal: number | null = null;
  let extraordinaryFinal: number | null = null;
  let specialTotal: number | null = null;
  let situation: FinalSituation = 'PENDIENTE';

  if (finalScore != null) {
    if (finalScore >= passing) {
      situation = 'A';
    } else if (final?.completiveScore != null) {
      completiveFinal = round1(finalScore * 0.5 + final.completiveScore * 0.5);
      if (completiveFinal >= passing) {
        situation = 'A';
      } else if (final.extraordinaryScore != null) {
        const weights = EXTRAORDINARY_WEIGHTS[EXTRAORDINARY_FORMULA];
        extraordinaryFinal = round1(
          finalScore * weights.final + final.extraordinaryScore * weights.exam,
        );
        if (extraordinaryFinal >= passing) {
          situation = 'A';
        } else if (final.specialScore != null) {
          specialTotal = round1(finalScore + final.specialScore);
          situation = specialTotal >= passing ? 'A' : 'R';
        }
      }
    }
  }

  return {
    effective,
    blockAverages,
    periodAverages,
    finalScore,
    completiveFinal,
    extraordinaryFinal,
    specialTotal,
    situation,
  };
}

export interface ScoredActivity {
  score: number | null;
  maxScore: number;
  weight: number;
}

/**
 * Nota de un bloque en un periodo a partir de las actividades evaluadas:
 * promedio ponderado de (puntuación / máximo × 100).
 */
export function weightedActivityScore(
  activities: ScoredActivity[],
): number | null {
  let total = 0;
  let weights = 0;
  for (const a of activities) {
    if (!isGradableScore(a.score) || a.maxScore <= 0 || a.weight <= 0) continue;
    total += (a.score / a.maxScore) * 100 * a.weight;
    weights += a.weight;
  }
  if (weights === 0) return null;
  return round1(total / weights);
}

export type AchievementLevel =
  'INICIO' | 'EN_PROCESO' | 'LOGRADO' | 'EXCELENTE';

/** Nivel de logro (columnas de la rúbrica: Inicio, En proceso, Logrado, Excelente). */
export function achievementLevel(
  score: number | null,
  passing = DEFAULT_PASSING_SCORE,
): AchievementLevel | null {
  if (score == null) return null;
  if (score >= ACHIEVEMENT_THRESHOLDS.EXCELENTE) return 'EXCELENTE';
  if (score >= passing) return 'LOGRADO';
  if (score >= passing - ACHIEVEMENT_THRESHOLDS.EN_PROCESO_MARGIN)
    return 'EN_PROCESO';
  return 'INICIO';
}
