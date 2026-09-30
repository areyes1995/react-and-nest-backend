// Cálculo del registro oficial en el cliente (vista previa inmediata
// mientras se editan notas). Replica el cálculo del servidor.

import type { FinalEntry, GradeEntry, GradeSummary } from '@services/types'

const avg = (values: Array<number | null | undefined>) => {
  const list = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : null
}

export const effective = (score: number | null, recovery: number | null) =>
  score == null ? recovery : recovery == null ? score : Math.max(score, recovery)

export function summarize(entries: GradeEntry[], final: FinalEntry | null, passing = 70): GradeSummary {
  const eff: GradeSummary['effective'] = {}
  for (let b = 1; b <= 4; b++) {
    eff[b] = { 1: null, 2: null, 3: null, 4: null }
  }
  for (const e of entries) if (eff[e.block]) eff[e.block][e.period] = effective(e.score, e.recovery)
  const blockAverages: Record<number, number | null> = {}
  for (let b = 1; b <= 4; b++) {
    const a = avg([1, 2, 3, 4].map((p) => eff[b][p]))
    blockAverages[b] = a == null ? null : Math.round(a)
  }
  const periodAverages: Record<number, number | null> = {}
  for (let p = 1; p <= 4; p++) {
    const a = avg([1, 2, 3, 4].map((b) => eff[b][p]))
    periodAverages[p] = a == null ? null : Math.round(a * 10) / 10
  }
  const cf = avg(Object.values(blockAverages))
  const finalScore = cf == null ? null : Math.round(cf)
  let completiveFinal: number | null = null
  let extraordinaryFinal: number | null = null
  let specialTotal: number | null = null
  let situation: GradeSummary['situation'] = 'PENDIENTE'
  const r1 = (n: number) => Math.round(n * 10) / 10
  if (finalScore != null) {
    if (finalScore >= passing) situation = 'A'
    else if (final?.completiveScore != null) {
      completiveFinal = r1(finalScore * 0.5 + final.completiveScore * 0.5)
      if (completiveFinal >= passing) situation = 'A'
      else if (final.extraordinaryScore != null) {
        extraordinaryFinal = r1(finalScore * 0.3 + final.extraordinaryScore * 0.7)
        if (extraordinaryFinal >= passing) situation = 'A'
        else if (final.specialScore != null) {
          specialTotal = r1(finalScore + final.specialScore)
          situation = specialTotal >= passing ? 'A' : 'R'
        }
      }
    }
  }
  return { effective: eff, blockAverages, periodAverages, finalScore, completiveFinal, extraordinaryFinal, specialTotal, situation }
}

/**
 * Columnas D…AI de la plantilla oficial "récord de notas":
 * por cada competencia (4) → P1 RP P2 RP P3 RP P4 RP.
 */
export function templateColumn(index: number): { block: number; period: number; recovery: boolean } {
  const block = Math.floor(index / 8) + 1
  const pos = index % 8
  return { block, period: Math.floor(pos / 2) + 1, recovery: pos % 2 === 1 }
}
