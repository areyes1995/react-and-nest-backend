// HTML del plan de clase con la plantilla oficial (para Word y PDF).

import type { LessonMoment, ResolvedCurriculum } from '@services/types'
import { escapeHtml as e } from '@lib/exporters'
import { formatDate } from '@lib/format'

const MOMENT_LABEL: Record<string, string> = { INICIO: 'Inicio', DESARROLLO: 'Desarrollo', CIERRE: 'Cierre' }

export interface PlanDocumentData {
  title: string
  topic: string
  gradeName: string
  sectionName?: string | null
  date?: string | null
  durationMinutes?: number
  purpose?: string | null
  strategies?: string[]
  moments: LessonMoment[]
  indicators: string[]
  curriculum?: ResolvedCurriculum | null
  assignment?: string | null
  teacherName?: string
  institution?: string | null
}

const list = (items?: string[]) => (items?.length ? `<ul>${items.map((i) => `<li>${e(i)}</li>`).join('')}</ul>` : '')

export function planDocumentHtml(d: PlanDocumentData): string {
  const competences = d.curriculum?.competences ?? []
  const contents = d.curriculum?.contents ?? []
  const rows = d.moments
    .map(
      (m, i) => `<tr>
        <td><b>${MOMENT_LABEL[m.moment] ?? m.moment}</b></td>
        <td class="center">${m.minutes} minutos</td>
        <td>${list(m.activities)}</td>
        ${i === 0 ? `<td rowspan="${d.moments.length}">${d.indicators.map((t) => `<p>${e(t)}</p>`).join('') || '—'}</td>` : ''}
        <td>${e(m.metacognition ?? '')}</td>
        <td>${list(m.evidences)}</td>
        <td>${list(m.techniques)}</td>
        <td>${list(m.resources)}</td>
      </tr>`,
    )
    .join('')

  return `
    <h1>${e(d.title)}</h1>
    <p class="muted">${e(d.institution ?? '')}${d.institution ? ' · ' : ''}Docente: ${e(d.teacherName ?? '')} · ${e(d.gradeName)}${
      d.sectionName ? ` ${e(d.sectionName)}` : ''
    }${d.date ? ` · ${e(formatDate(d.date, { day: 'numeric', month: 'long', year: 'numeric' }))}` : ''}${
      d.durationMinutes ? ` · ${d.durationMinutes} minutos` : ''
    }</p>
    ${d.purpose ? `<h2>Propósito</h2><p>${e(d.purpose)}</p>` : ''}
    ${
      competences.length
        ? `<h2>Competencias específicas</h2><ul>${competences
            .map((c) => `<li><b>${e(c.fundamental.name)}:</b> ${e(c.description)}</li>`)
            .join('')}</ul>`
        : ''
    }
    ${contents.length ? `<h2>Contenidos</h2>${list(contents.map((c) => (c.block ? `${c.block}: ${c.description}` : c.description)))}` : ''}
    <h2>Esquema plan de clase: ${e(d.gradeName)}</h2>
    <table>
      <tr><td colspan="8" class="band"><b>Estrategias de Enseñanza y de aprendizaje:</b>${list(d.strategies)}</td></tr>
      <tr>
        <th rowspan="2">Momento</th><th rowspan="2">Tiempo</th><th rowspan="2">Actividades de enseñanza/aprendizaje</th>
        <th colspan="4" class="center">Elementos de evaluación</th><th rowspan="2">Recursos</th>
      </tr>
      <tr><th>Indicadores de logro</th><th>Metacognición</th><th>Evidencias</th><th>Técnicas e instrumentos</th></tr>
      ${rows}
    </table>
    ${d.assignment ? `<h2>Asignación</h2><p>${e(d.assignment)}</p>` : ''}
    <div class="sig"><div>Firma del docente</div><div>Coordinación pedagógica</div></div>
  `
}
