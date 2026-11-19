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
  moduleTitle?: string | null
  score?: string | null
  activityNumber?: number | string | null
  ra?: string | null
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

const uniq = (items: string[]) => [...new Set(items.filter(Boolean))]

/**
 * Plantilla YinT 2024: matriz de planificación diaria o por actividad de
 * aprendizaje. Conserva los encabezados y apartados del documento original.
 */
export function yintMatrixHtml(d: PlanDocumentData): string {
  const curriculum = d.curriculum
  const axes = curriculum?.axes ?? []
  const competences = curriculum?.competences ?? []
  const capacities = curriculum?.capacities ?? []
  const performances = curriculum?.performances ?? []
  const indicators = curriculum?.indicators ?? []
  const raParts = [
    ...axes.map((a) => `<b>${e(a.name)}:</b> ${e(a.description)}`),
    ...competences.map((c) => `<b>${e(c.fundamental.name)}:</b> ${e(c.description)}`),
    ...capacities.map((c) => e(c.description)),
    ...performances.map((p) => e(p.description)),
    ...indicators.map((i) => e(i.description)),
  ]
  const ra = d.ra
    ? `<p>${e(d.ra)}</p>`
    : raParts.length
      ? raParts.map((part) => `<p>${part}</p>`).join('')
      : '<p>—</p>'
  const moments = (['INICIO', 'DESARROLLO', 'CIERRE'] as const)
    .map((key, index) => {
      const moment = d.moments.find((m) => m.moment === key)
      const label = ['1er Momento. Inicio', '2do Momento. Desarrollo: (conceptual/ procedimental y/o Actitudinal)', '3er Momento. Cierre'][index]
      return `<p><b>${label}:</b></p>${moment ? list(moment.activities) : '<p>—</p>'}`
    })
    .join('')
  const resources = uniq(d.moments.flatMap((m) => m.resources ?? []))
  const instruments = uniq([
    ...d.moments.flatMap((m) => m.techniques ?? []),
    ...d.moments.flatMap((m) => m.evidences ?? []),
  ])
  const activity = d.activityNumber ?? 1

  return `
    <table class="yint">
      <tr><td colspan="4" class="head">MATRIZ DE PLANIFICACION DIARIA O POR ACTIVIDAD DE APRENDIZAJE</td></tr>
      <tr>
        <td><b>Institución:</b> ${e(d.institution ?? '')}</td>
        <td colspan="3"><b>Título:</b> ${e(d.title)}</td>
      </tr>
      <tr>
        <td><b>Módulo Formativo (MF):</b> ${e(d.moduleTitle ?? d.gradeName)}</td>
        <td><b>Puntuación:</b> ${e(d.score ?? '')}</td>
        <td><b>Nombre del Docente:</b> ${e(d.teacherName ?? '')}</td>
        <td>${d.date ? e(formatDate(d.date, { day: 'numeric', month: 'long', year: 'numeric' })) : ''}</td>
      </tr>
      <tr><td colspan="4"><b>ACTIVIDAD ${e(activity)}:</b> ${e(d.topic)}</td></tr>
      <tr><td colspan="4"><b>RA ${e(activity)} :</b>${ra}</td></tr>
      <tr><td colspan="4"><b>DESCRIPCIÓN DE LA ACTIVIDAD:</b>${moments}</td></tr>
      <tr><td colspan="4"><b>Estrategia(s) utilizada(s):</b>${list(d.strategies)}</td></tr>
      <tr><td colspan="4"><b>Recursos:</b>${list(resources)}</td></tr>
      <tr><td colspan="4"><b>Instrumentos de evaluación:</b>${list(instruments)}</td></tr>
    </table>
  `
}
