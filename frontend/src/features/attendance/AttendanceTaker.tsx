import { useEffect, useMemo, useState } from 'react'
import { CheckCheck, Save } from 'lucide-react'
import { attendanceApi } from '@services/educraft'
import type { AttendanceRoster, AttendanceStats, AttendanceStatus } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Button, Input, Spinner, TONE_CLASSES } from '@components/ui'
import { ATTENDANCE } from '@lib/labels'
import { cn } from '@lib/cn'
import { formatPercent, today } from '@lib/format'

const STATUSES: AttendanceStatus[] = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED']

const ACTIVE: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-emerald-500 text-white border-emerald-500',
  LATE: 'bg-amber-400 text-white border-amber-400',
  ABSENT: 'bg-red-500 text-white border-red-500',
  EXCUSED: 'bg-blue-500 text-white border-blue-500',
}

/** Pase de lista optimizado para tabletas: casillas grandes P/T/F/J. */
export function AttendanceTaker({
  sectionId,
  date: initialDate,
  onSaved,
  compact,
}: {
  sectionId: number
  date?: string
  onSaved?: (stats: AttendanceStats) => void
  compact?: boolean
}) {
  const { success, error } = useFeedback()
  const [date, setDate] = useState(initialDate ?? today())
  const [roster, setRoster] = useState<AttendanceRoster | null>(null)
  const [marks, setMarks] = useState<Record<number, AttendanceStatus>>({})
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<AttendanceStats | null>(null)

  useEffect(() => {
    setRoster(null)
    attendanceApi
      .roster(sectionId, date)
      .then((r) => {
        setRoster(r)
        setMarks(Object.fromEntries(r.students.filter((s) => s.status).map((s) => [s.id, s.status!])))
      })
      .catch((err) => error('No se pudo cargar la lista', (err as Error).message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, date])

  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 }
    for (const v of Object.values(marks)) c[v]++
    return c
  }, [marks])

  if (!roster) return <Spinner />

  const allPresent = () => setMarks(Object.fromEntries(roster.students.map((s) => [s.id, 'PRESENT' as AttendanceStatus])))
  const pending = roster.students.filter((s) => !marks[s.id]).length

  const save = async () => {
    setSaving(true)
    try {
      const result = await attendanceApi.save({
        sectionId,
        date,
        entries: roster.students.filter((s) => marks[s.id]).map((s) => ({ studentId: s.id, status: marks[s.id] })),
      })
      setStats(result)
      success('Asistencia guardada', `Asistencia de la sección: ${formatPercent(result.rate)}`)
      onSaved?.(result)
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        <Button variant="soft" size="sm" icon={<CheckCheck className="h-4 w-4" />} onClick={allPresent}>
          Todos presentes
        </Button>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <span key={s} className={cn('pill', TONE_CLASSES[ATTENDANCE[s].tone])}>
              [{ATTENDANCE[s].short}] {ATTENDANCE[s].label}: {counts[s]}
            </span>
          ))}
        </div>
      </div>

      <div className={cn('overflow-y-auto rounded-2xl border border-line', compact ? 'max-h-[52vh]' : 'max-h-[64vh]')}>
        <table className="table">
          <thead>
            <tr>
              <th className="w-10">No.</th>
              <th>Estudiante</th>
              {STATUSES.map((s) => (
                <th key={s} className="w-16 text-center" style={{ color: ATTENDANCE[s].color }}>
                  {ATTENDANCE[s].short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roster.students.map((st) => (
              <tr key={st.id}>
                <td className="text-ink-3">{st.listNumber}</td>
                <td className="font-medium text-ink">
                  {st.lastName}, {st.firstName}
                </td>
                {STATUSES.map((s) => (
                  <td key={s} className="text-center">
                    <button
                      onClick={() => setMarks((m) => ({ ...m, [st.id]: s }))}
                      aria-label={`${ATTENDANCE[s].label}: ${st.firstName}`}
                      className={cn(
                        'h-9 w-9 rounded-xl border-2 text-sm font-bold transition',
                        marks[st.id] === s ? ACTIVE[s] : 'border-line bg-surface text-ink-3 hover:border-violet-300',
                      )}
                    >
                      {ATTENDANCE[s].short}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-3">
          {pending ? `${pending} estudiante(s) sin marcar.` : 'Todos marcados.'}
          {stats && ` Asistencia de la sección: ${formatPercent(stats.rate)}.`}
        </p>
        <Button onClick={save} loading={saving} icon={<Save className="h-4 w-4" />} disabled={!Object.keys(marks).length}>
          Guardar pase de lista
        </Button>
      </div>
    </div>
  )
}
