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
// ──────────────────────────────────────────────

export const GRADING_BLOCKS = [
  { block: 1, code: 'PC1', name: 'Competencia comunicativa' },
  { block: 2, code: 'PC2', name: 'Pensamiento lógico, creativo y resolución de problemas' },
  { block: 3, code: 'PC3', name: 'Ética y ciudadanía - desarrollo personal' },
  { block: 4, code: 'PC4', name: 'Científica y tecnológica - ambiental y de la salud' },
] as const;

export const PERIODS = [1, 2, 3, 4] as const;
export const DEFAULT_PASSING_SCORE = 70;

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

const round = (n: number) => Math.round(n);
const round1 = (n: number) => Math.round(n * 10) / 10;

function average(values: Array<number | null | undefined>): number | null {
  const list = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (list.length === 0) return null;
  return list.reduce((a, b) => a + b, 0) / list.length;
}

export function effectiveScore(score: number | null, recovery: number | null): number | null {
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
    const avg = average(GRADING_BLOCKS.map(({ block }) => effective[block][period]));
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
        extraordinaryFinal = round1(finalScore * 0.3 + final.extraordinaryScore * 0.7);
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
export function weightedActivityScore(activities: ScoredActivity[]): number | null {
  let total = 0;
  let weights = 0;
  for (const a of activities) {
    if (a.score == null || a.maxScore <= 0 || a.weight <= 0) continue;
    total += (a.score / a.maxScore) * 100 * a.weight;
    weights += a.weight;
  }
  if (weights === 0) return null;
  return round1(total / weights);
}

export type AchievementLevel = 'INICIO' | 'EN_PROCESO' | 'LOGRADO' | 'EXCELENTE';

/** Nivel de logro (columnas de la rúbrica: Inicio, En proceso, Logrado, Excelente). */
export function achievementLevel(score: number | null, passing = DEFAULT_PASSING_SCORE): AchievementLevel | null {
  if (score == null) return null;
  if (score >= 90) return 'EXCELENTE';
  if (score >= passing) return 'LOGRADO';
  if (score >= passing - 10) return 'EN_PROCESO';
  return 'INICIO';
}
