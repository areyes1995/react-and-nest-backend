import type { LessonMoment, ResolvedCurriculum } from '@services/types'

const MOMENT_LABEL: Record<string, string> = { INICIO: 'Inicio', DESARROLLO: 'Desarrollo', CIERRE: 'Cierre' }

/**
 * Vista del "Esquema plan de clase" oficial: Momento | Tiempo |
 * Actividades | Indicadores de logro | Metacognición | Evidencias |
 * Técnicas e instrumentos | Recursos.
 */
export function LessonPlanTable({
  moments,
  strategies,
  indicators,
  title,
}: {
  moments: LessonMoment[]
  strategies?: string[]
  indicators?: string[]
  title?: string
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-amber-200 dark:border-amber-900/50">
      <table className="w-full min-w-[56rem] border-collapse text-xs">
        <thead>
          {title && (
            <tr>
              <th colSpan={8} className="bg-amber-100 px-3 py-2 text-center text-sm font-bold text-amber-950 dark:bg-amber-900/40 dark:text-amber-100">
                {title}
              </th>
            </tr>
          )}
          {!!strategies?.length && (
            <tr>
              <td colSpan={8} className="bg-amber-50 px-3 py-2 text-left text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                <b>Estrategias de enseñanza y de aprendizaje:</b>
                <ul className="mt-1 list-inside list-disc">
                  {strategies.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </td>
            </tr>
          )}
          <tr className="bg-amber-100/70 text-amber-950 dark:bg-amber-900/30 dark:text-amber-100">
            {['Momento', 'Tiempo', 'Actividades de enseñanza/aprendizaje', 'Indicadores de logro', 'Metacognición', 'Evidencias', 'Técnicas e instrumentos', 'Recursos'].map((h) => (
              <th key={h} className="border border-amber-200 px-2 py-2 text-left font-bold dark:border-amber-900/50">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {moments.map((m, i) => (
            <tr key={m.moment} className="align-top text-ink-2">
              <td className="border border-amber-200 px-2 py-2 font-bold text-ink dark:border-amber-900/50">{MOMENT_LABEL[m.moment] ?? m.moment}</td>
              <td className="whitespace-nowrap border border-amber-200 px-2 py-2 dark:border-amber-900/50">{m.minutes} min</td>
              <td className="border border-amber-200 px-2 py-2 dark:border-amber-900/50">
                <ul className="space-y-1">
                  {m.activities.map((a, k) => (
                    <li key={k}>- {a}</li>
                  ))}
                </ul>
              </td>
              {i === 0 && (
                <td rowSpan={moments.length} className="border border-amber-200 px-2 py-2 dark:border-amber-900/50">
                  {indicators?.length ? indicators.map((t, k) => <p key={k} className="mb-1">{t}</p>) : <span className="text-ink-3">—</span>}
                </td>
              )}
              <td className="border border-amber-200 px-2 py-2 dark:border-amber-900/50">{m.metacognition}</td>
              <td className="border border-amber-200 px-2 py-2 dark:border-amber-900/50">{m.evidences?.map((e, k) => <p key={k}>- {e}</p>)}</td>
              <td className="border border-amber-200 px-2 py-2 dark:border-amber-900/50">{m.techniques?.map((e, k) => <p key={k}>- {e}</p>)}</td>
              <td className="border border-amber-200 px-2 py-2 dark:border-amber-900/50">{m.resources?.map((e, k) => <p key={k}>- {e}</p>)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function indicatorTexts(curriculum?: ResolvedCurriculum | null, evaluation?: Record<string, unknown> | null): string[] {
  if (curriculum?.indicators.length) return curriculum.indicators.map((i) => i.description)
  const fromEval = (evaluation as { indicators?: string[] } | null)?.indicators
  return Array.isArray(fromEval) ? fromEval : []
}
