import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { attendanceApi } from '@services/educraft'
import type { AttendanceStats, Section } from '@services/types'
import { Badge, Button, Card, CardHeader, Spinner } from '@components/ui'
import { AttendanceTaker } from '@/features/attendance/AttendanceTaker'
import { exportExcel } from '@lib/exporters'
import { ATTENDANCE } from '@lib/labels'
import { formatDate, formatPercent, sectionLabel, slugify } from '@lib/format'

export function AttendanceTab({ section }: { section: Section }) {
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const load = () => attendanceApi.stats(section.id).then(setStats).catch(() => setStats(null))
  useEffect(() => {
    void load()
  }, [section.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const exportStats = () =>
    stats &&
    exportExcel(
      [
        {
          name: 'Asistencia',
          title: `Asistencia — ${sectionLabel(section.grade.name, section.name)}`,
          header: ['No.', 'Estudiante', 'Presente', 'Tardanza', 'Falta', 'Justificada', '% asistencia'],
          rows: stats.students.map((s) => [s.listNumber, `${s.lastName}, ${s.firstName}`, s.counts.PRESENT, s.counts.LATE, s.counts.ABSENT, s.counts.EXCUSED, s.rate]),
          widths: [5, 30, 10, 10, 10, 12, 12],
        },
      ],
      `asistencia-${slugify(sectionLabel(section.grade.name, section.name))}`,
    )

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
      <Card className="card-pad">
        <CardHeader title="Registro de asistencia interactiva" subtitle="P: presente · T: tardanza · F: falta · J: justificada" />
        <AttendanceTaker sectionId={section.id} onSaved={setStats} />
      </Card>
      <Card className="card-pad">
        <CardHeader
          title="Estadísticas"
          subtitle={stats ? `Asistencia de la sección: ${formatPercent(stats.rate)}` : undefined}
          action={
            <Button size="sm" variant="secondary" icon={<Download className="h-3.5 w-3.5" />} onClick={exportStats}>
              Excel
            </Button>
          }
        />
        {!stats ? (
          <Spinner />
        ) : (
          <>
            <div className="h-40">
              <ResponsiveContainer>
                <LineChart data={stats.days.map((d) => ({ date: formatDate(d.date, { day: 'numeric', month: 'short' }), rate: d.rate }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-3)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-3)' }} width={28} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Asistencia']} />
                  <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 max-h-80 overflow-y-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th className="text-center">F</th>
                    <th className="text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.students]
                    .sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101))
                    .map((s) => (
                      <tr key={s.id}>
                        <td className="text-xs">
                          {s.lastName}, {s.firstName}
                        </td>
                        <td className="text-center text-xs" style={{ color: ATTENDANCE.ABSENT.color }}>
                          {s.counts.ABSENT}
                        </td>
                        <td className="text-right">
                          <Badge tone={s.rate == null ? 'gray' : s.rate >= 90 ? 'green' : s.rate >= 80 ? 'yellow' : 'red'}>{formatPercent(s.rate)}</Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
