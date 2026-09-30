import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, GraduationCap, Users } from 'lucide-react'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Dashboard } from '@services/types'
import { Card, CardHeader, Select } from '@components/ui'
import { CompetenceDetailModal } from '@/features/reports/CompetenceDetailModal'
const RADAR_LABEL: Record<number, string> = { 1: 'Comunica', 2: 'Razona y resuelve', 3: 'Ética', 4: 'Ciencia y tec.' }
import { formatPercent, formatScore } from '@lib/format'

const BLOCK_COLORS = ['#ec4899', '#8b5cf6', '#f97316', '#3b82f6']

export function ClassSummary({
  dashboard,
  period,
  onPeriod,
}: {
  dashboard: Dashboard
  period: number | undefined
  onPeriod: (p: number | undefined) => void
}) {
  const navigate = useNavigate()
  const [block, setBlock] = useState<number | null>(null)
  const s = dashboard.summary
  const data = s.competences.map((c) => ({ key: c.block, label: RADAR_LABEL[c.block], value: c.average ?? 0, raw: c.average }))
  const attendanceTone = s.attendanceRate == null ? '' : s.attendanceRate >= 90 ? 'Excelente' : s.attendanceRate >= 80 ? 'Buena' : 'Requiere atención'

  return (
    <Card className="card-pad">
      <CardHeader
        title="Resumen de la clase"
        action={
          <Select
            value={period ?? ''}
            onChange={(e) => onPeriod(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Anual"
            options={[1, 2, 3, 4].map((p) => ({ value: p, label: `${p}° Periodo${dashboard.schoolYear?.currentPeriod === p ? ' (actual)' : ''}` }))}
            className="h-8 w-auto py-0 text-xs"
          />
        }
      />
      <div className="grid grid-cols-3 gap-2">
        <Metric icon={<Users className="h-4 w-4 text-pink-500" />} label="Estudiantes" value={String(s.students)} hint="Activos" onClick={() => navigate('/app/seguimiento?filtro=todos')} />
        <Metric icon={<GraduationCap className="h-4 w-4 text-amber-500" />} label="Promedio general" value={formatScore(s.average, 1)} hint="Sobre 100" onClick={() => navigate('/app/seguimiento?filtro=promedio')} />
        <Metric
          icon={<CalendarCheck className="h-4 w-4 text-emerald-500" />}
          label="Asistencia promedio"
          value={formatPercent(s.attendanceRate)}
          hint={attendanceTone}
          hintClass={s.attendanceRate != null && s.attendanceRate >= 90 ? 'text-emerald-500 font-semibold' : undefined}
          onClick={() => navigate('/app/seguimiento?filtro=asistencia')}
        />
      </div>
      <p className="mb-1 mt-4 text-xs font-bold text-ink">Desempeño por competencia</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="62%" margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="#f0abfc" strokeOpacity={0.45} />
            <PolarAngleAxis
              dataKey="label"
              tick={(props) => {
                const { x, y, payload, index } = props as { x: number; y: number; payload: { value: string }; index: number }
                const item = data[index]
                return (
                  <g onClick={() => setBlock(item.key)} style={{ cursor: 'pointer' }}>
                    <text x={x} y={y} textAnchor="middle" fontSize={11} fill="var(--text-2)">
                      {payload.value}
                    </text>
                    <text x={x} y={y + 14} textAnchor="middle" fontSize={12} fontWeight={700} fill={BLOCK_COLORS[index]}>
                      {item.raw == null ? '—' : `${Math.round(item.raw)}%`}
                    </text>
                  </g>
                )
              }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar dataKey="value" stroke="#ec4899" fill="#ec4899" fillOpacity={0.25} strokeWidth={2} />
            <Tooltip formatter={(v) => [`${formatScore(Number(v), 1)}`, 'Promedio']} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-[0.7rem] text-ink-3">Haz clic en una competencia para ver el reporte de logro curricular.</p>
      <CompetenceDetailModal open={block != null} onClose={() => setBlock(null)} block={block} sections={dashboard.sections} period={period} />
    </Card>
  )
}

function Metric({
  icon,
  label,
  value,
  hint,
  hintClass,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  hintClass?: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-line p-2.5 text-center transition hover:-translate-y-0.5 hover:shadow-card">
      <p className="text-[0.68rem] font-semibold text-ink-3">{label}</p>
      <p className="mt-1 flex items-center justify-center gap-1.5 text-xl font-extrabold text-ink">
        {icon} {value}
      </p>
      {hint && <p className={hintClass ?? 'text-[0.68rem] text-ink-3'}>{hint}</p>}
    </button>
  )
}
