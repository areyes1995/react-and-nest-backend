import { useEffect, useState } from 'react'
import { FileDown, Printer } from 'lucide-react'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { reportApi } from '@services/educraft'
import type { Bulletin, ParentReport } from '@services/types'
import { Badge, Button, Modal, Spinner } from '@components/ui'
import { LogoMark } from '@components/brand/Logo'
import { ATTENDANCE, BLOCK_SHORT, LEVELS, OBSERVATION_TYPES } from '@lib/labels'
import { escapeHtml as e, exportWord, printDocument } from '@lib/exporters'
import { formatDate, formatPercent, formatScore, slugify } from '@lib/format'

const SUBJECTS = [
  'Lengua Española',
  'Matemática',
  'Ciencias Sociales',
  'Ciencias de la Naturaleza',
  'Lenguas Extranjeras (Inglés)',
  'Lenguas Extranjeras (Francés)',
  'Educación Física',
  'Educación Artística',
  'Formación Integral, Humana y Religiosa',
]

const cell = (v: number | null | undefined) => (v == null ? '' : formatScore(v))

/** HTML del boletín con la estructura de la plantilla oficial. */
export function bulletinHtml(b: Bulletin) {
  const value = (period: number, block: number, recovery: boolean) => {
    const entry = b.entries.find((x) => x.period === period && x.block === block)
    return cell(recovery ? entry?.recovery : entry?.score)
  }
  const mathCells = [1, 2, 3, 4]
    .flatMap((block) => [1, 2, 3, 4].flatMap((p) => [`<td class="center">${value(p, block, false)}</td>`, `<td class="center">${value(p, block, true)}</td>`]))
    .join('')
  const pcs = [1, 2, 3, 4].map((k) => `<td class="center"><b>${cell(b.summary.blockAverages[k])}</b></td>`).join('')
  const empty = '<td></td>'.repeat(32 + 4 + 4)
  const rows = SUBJECTS.map((s) =>
    s === 'Matemática'
      ? `<tr><td><b>${s}</b></td>${mathCells}${pcs}<td class="center"><b>${cell(b.summary.finalScore)}</b></td><td class="center">${cell(b.final?.completiveScore)}</td><td class="center">${cell(b.final?.extraordinaryScore)}</td><td class="center">${cell(b.final?.specialScore)}</td></tr>`
      : `<tr><td>${s}</td>${empty}</tr>`,
  ).join('')
  const competenceHeader = b.blocks.map((bl) => `<th colspan="8" class="center">${e(bl.name)}</th>`).join('')
  const periodHeader = [1, 2, 3, 4].map(() => [1, 2, 3, 4].map((p) => `<th>P${p}</th><th>RP${p}</th>`).join('')).join('')
  const situation = b.summary.situation
  return `
    <table>
      <tr><td colspan="45" class="head">Boletín de notas — Nivel ${e(b.level)}</td></tr>
      <tr><td colspan="45">Grado: <b>${e(b.grade)}</b> &nbsp; Ciclo: <b>${e(b.cycle)}</b> &nbsp; Nivel: <b>${e(b.level)}</b> &nbsp; Sección: <b>${e(b.section)}</b> &nbsp; Año escolar: <b>${e(b.schoolYear)}</b></td></tr>
      <tr><td colspan="45">Nombres y Apellidos: <b>${e(b.student.firstName)} ${e(b.student.lastName)}</b> &nbsp; Número: <b>${e(b.student.listNumber ?? '')}</b> &nbsp; Docente: <b>${e(b.teacher.name)}</b>${
        b.teacher.institution ? ` &nbsp; Centro: <b>${e(b.teacher.institution)}</b>` : ''
      }</td></tr>
      <tr><th rowspan="2">Asignatura Académica</th>${competenceHeader}<th colspan="4" class="center">Promedio</th><th rowspan="2">Calificación final</th><th rowspan="2">Calificación completiva</th><th rowspan="2">Calificación extraordinaria</th><th rowspan="2">Calificación especial</th></tr>
      <tr>${periodHeader}<th>PC1</th><th>PC2</th><th>PC3</th><th>PC4</th></tr>
      ${rows}
    </table>
    <p class="muted">PC1: Competencia comunicativa · PC2: Pensamiento lógico, creativo y resolución de problemas · PC3: Ética y ciudadanía - desarrollo personal · PC4: Científica y tecnológica - ambiental y de la salud. Nota mínima: ${b.passing}.</p>
    <p>${situation === 'A' ? '☑' : '☐'} Promovido &nbsp;&nbsp; ${situation === 'PENDIENTE' ? '☑' : '☐'} Promovido pendiente &nbsp;&nbsp; ${situation === 'R' ? '☑' : '☐'} Repite el grado</p>
    <div class="sig">
      <div>${b.teacher.signature ? `<img src="${b.teacher.signature}" style="height:48px"/><br/>` : ''}${e(b.teacher.name)}<br/>Docente</div>
      <div>Director(a) del Centro Educativo</div>
    </div>
    <p class="muted">Fuente: plantilla de registro MINERD. Generado con Educraft XYZ.</p>
  `
}

export function BulletinModal({ studentId, onClose }: { studentId: number | null; onClose: () => void }) {
  const [data, setData] = useState<Bulletin | null>(null)
  useEffect(() => {
    setData(null)
    if (studentId) reportApi.bulletin(studentId).then(setData).catch(() => setData(null))
  }, [studentId])
  const name = data ? `boletin-${slugify(`${data.student.lastName} ${data.student.firstName}`)}` : 'boletin'
  return (
    <Modal
      open={!!studentId}
      onClose={onClose}
      size="full"
      title="Boletín de notas"
      subtitle="Plantilla oficial de boletín y récord de notas"
      footer={
        data && (
          <>
            <Button variant="secondary" icon={<FileDown className="h-4 w-4" />} onClick={() => exportWord('Boletín', bulletinHtml(data), name)}>
              Word
            </Button>
            <Button icon={<Printer className="h-4 w-4" />} onClick={() => printDocument('Boletín de notas', bulletinHtml(data))}>
              Imprimir / PDF
            </Button>
          </>
        )
      }
    >
      {!data ? <Spinner /> : <div className="bulletin-preview overflow-auto rounded-2xl border border-line bg-white p-4 text-[11px] text-slate-900 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-violet-200 [&_td]:p-1 [&_th]:border [&_th]:border-violet-200 [&_th]:bg-violet-50 [&_th]:p-1 [&_.head]:bg-amber-100 [&_.head]:text-center [&_.head]:font-bold [&_.center]:text-center [&_.muted]:text-[10px] [&_.muted]:text-slate-500 [&_.sig]:mt-8 [&_.sig]:flex [&_.sig]:gap-16 [&_.sig>div]:min-w-[180px] [&_.sig>div]:border-t [&_.sig>div]:border-slate-800 [&_.sig>div]:pt-1 [&_.sig>div]:text-center" dangerouslySetInnerHTML={{ __html: bulletinHtml(data) }} />}
    </Modal>
  )
}

// ── Reporte para padres ─────────────────────────

export function parentReportHtml(r: ParentReport) {
  return `
    <h1>Informe para la familia</h1>
    <p class="muted">${e(r.student.firstName)} ${e(r.student.lastName)} · ${e(r.grade)} ${e(r.section)} · ${e(r.schoolYear)} · Docente: ${e(r.teacher.name)}</p>
    <h2>Resumen de asistencia</h2>
    <p>Asistencia: <b>${formatPercent(r.attendance.rate)}</b> (${r.attendance.counts.PRESENT} presentes, ${r.attendance.counts.LATE} tardanzas, ${r.attendance.counts.ABSENT} faltas, ${r.attendance.counts.EXCUSED} justificadas).</p>
    <h2>Rendimiento por competencia</h2>
    <table><tr><th>Competencia</th><th>Promedio</th><th>Nivel de logro</th></tr>
    ${r.competences.map((c) => `<tr><td>${e(c.name)}</td><td class="center">${cell(c.score)}</td><td>${c.level ? LEVELS[c.level].label : '—'}</td></tr>`).join('')}
    <tr><td><b>Calificación final</b></td><td class="center"><b>${cell(r.summary.finalScore)}</b></td><td></td></tr></table>
    <h2>Fortalezas</h2>${r.strengths.length ? `<ul>${r.strengths.map((s) => `<li>${e(s)}</li>`).join('')}</ul>` : '<p>—</p>'}
    <h2>Aspectos por mejorar</h2>${r.improvements.length ? `<ul>${r.improvements.map((s) => `<li>${e(s)}</li>`).join('')}</ul>` : '<p>—</p>'}
    <h2>Observaciones del docente</h2>${r.observations.length ? `<ul>${r.observations.map((o) => `<li>${e(o.content)}</li>`).join('')}</ul>` : '<p>—</p>'}
    <h2>Recomendaciones para el acompañamiento en casa</h2><ul>${r.recommendations.map((s) => `<li>${e(s)}</li>`).join('')}</ul>
    <p class="muted">Generado el ${formatDate(r.generatedAt)} con Educraft XYZ.</p>`
}

export function ParentReportView({ report }: { report: ParentReport }) {
  const radar = report.competences.map((c) => ({ label: BLOCK_SHORT[c.block], value: c.score ?? 0 }))
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-gradient-to-r from-pink-50 to-violet-50 p-4 dark:from-pink-950/30 dark:to-violet-950/30">
        <LogoMark size={48} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-extrabold text-ink">
            {report.student.firstName} {report.student.lastName}
          </p>
          <p className="text-sm text-ink-3">
            {report.grade} {report.section} · {report.schoolYear} · {report.teacher.name}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-3">Calificación final</p>
          <p className="text-3xl font-extrabold text-gradient">{formatScore(report.summary.finalScore)}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line p-4">
          <p className="section-title mb-2">Rendimiento por competencia</p>
          <div className="h-56">
            <ResponsiveContainer>
              <RadarChart data={radar} outerRadius="70%">
                <PolarGrid stroke="#f0abfc" strokeOpacity={0.5} />
                <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1">
            {report.competences.map((c) => (
              <li key={c.block} className="flex items-center justify-between text-xs">
                <span className="text-ink-2">{c.name}</span>
                <span className="flex items-center gap-2">
                  <b>{formatScore(c.score)}</b>
                  {c.level && <Badge tone={LEVELS[c.level].tone}>{LEVELS[c.level].label}</Badge>}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-line p-4">
            <p className="section-title mb-2">Asistencia · {formatPercent(report.attendance.rate)}</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ATTENDANCE) as Array<keyof typeof ATTENDANCE>).map((k) => (
                <Badge key={k} tone={ATTENDANCE[k].tone}>
                  {ATTENDANCE[k].label}: {report.attendance.counts[k]}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-soft-green p-4">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Fortalezas</p>
              <ul className="mt-1 list-disc pl-4 text-xs text-ink-2">{report.strengths.length ? report.strengths.map((s) => <li key={s}>{s}</li>) : <li>En construcción</li>}</ul>
            </div>
            <div className="rounded-2xl bg-soft-orange p-4">
              <p className="text-sm font-bold text-orange-700 dark:text-orange-300">Aspectos por mejorar</p>
              <ul className="mt-1 list-disc pl-4 text-xs text-ink-2">{report.improvements.length ? report.improvements.map((s) => <li key={s}>{s}</li>) : <li>Ninguno destacado</li>}</ul>
            </div>
          </div>
        </div>
      </div>

      {report.observations.length > 0 && (
        <div className="rounded-2xl border border-line p-4">
          <p className="section-title mb-2">Observaciones del docente</p>
          <ul className="space-y-2">
            {report.observations.map((o, i) => (
              <li key={i} className="text-sm text-ink-2">
                <Badge tone={OBSERVATION_TYPES[o.type].tone}>{OBSERVATION_TYPES[o.type].label}</Badge> <span className="ml-1">{o.content}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="rounded-2xl bg-soft-purple p-4">
        <p className="section-title mb-2">Recomendaciones para el acompañamiento en casa</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
          {report.recommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function ParentReportModal({ studentId, onClose }: { studentId: number | null; onClose: () => void }) {
  const [data, setData] = useState<ParentReport | null>(null)
  useEffect(() => {
    setData(null)
    if (studentId) reportApi.parent(studentId).then(setData).catch(() => setData(null))
  }, [studentId])
  return (
    <Modal
      open={!!studentId}
      onClose={onClose}
      size="xl"
      title="Reporte para la familia"
      footer={
        data && (
          <>
            <Button variant="secondary" icon={<FileDown className="h-4 w-4" />} onClick={() => exportWord('Informe', parentReportHtml(data), `informe-${slugify(data.student.lastName)}`)}>
              Word
            </Button>
            <Button icon={<Printer className="h-4 w-4" />} onClick={() => printDocument('Informe para la familia', parentReportHtml(data), false)}>
              Imprimir / PDF
            </Button>
          </>
        )
      }
    >
      {!data ? <Spinner /> : <ParentReportView report={data} />}
    </Modal>
  )
}
