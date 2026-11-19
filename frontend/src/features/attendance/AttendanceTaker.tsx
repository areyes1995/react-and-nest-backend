import { Fragment, useEffect, useMemo, useState } from 'react'
import { CheckCheck, FileText, History, RotateCcw, Save, X } from 'lucide-react'
import { attendanceApi } from '@services/educraft'
import { del, get, type ApiResponse } from '@services/api'
import type { AttendanceRoster, AttendanceStats, AttendanceStatus } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Button, Input, Select, Spinner, TONE_CLASSES } from '@components/ui'
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

const REASONS = [
  { value: 'ENFERMEDAD', label: 'Enfermedad' },
  { value: 'CITA_MEDICA', label: 'Cita médica' },
  { value: 'FAMILIAR', label: 'Motivo familiar' },
  { value: 'CLIMA', label: 'Clima / desastre' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'ACTIVIDAD_ESCOLAR', label: 'Actividad escolar' },
  { value: 'OTRO', label: 'Otro' },
]

interface Justification {
  reason: string
  note: string
  attachment: string
}

type RosterStudent = AttendanceRoster['students'][number] & {
  justificationReason?: string | null
  justificationNote?: string | null
  justificationAttachment?: string | null
}
type Roster = Omit<AttendanceRoster, 'students'> & { students: RosterStudent[] }

interface AttendanceHistory {
  total: number
  records: Array<{
    id: number
    date: string
    status: AttendanceStatus
    justificationReason: string | null
    justificationNote: string | null
    student: { firstName: string; lastName: string }
  }>
}

async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const res = await promise
  if (!res.ok) throw new Error(res.error || 'No se pudo completar la operación')
  return res.data
}

const emptyJustification = (): Justification => ({ reason: '', note: '', attachment: '' })

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
  const [roster, setRoster] = useState<Roster | null>(null)
  const [marks, setMarks] = useState<Record<number, AttendanceStatus>>({})
  const [justifications, setJustifications] = useState<Record<number, Justification>>({})
  const [justifying, setJustifying] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [history, setHistory] = useState<AttendanceHistory | null>(null)

  const loadRoster = () => {
    setRoster(null)
    attendanceApi
      .roster(sectionId, date)
      .then((r) => {
        const loaded = r as Roster
        setRoster(loaded)
        setMarks(Object.fromEntries(loaded.students.filter((s) => s.status).map((s) => [s.id, s.status!])))
        const initial: Record<number, Justification> = {}
        for (const s of loaded.students) {
          if (s.justificationReason || s.justificationNote || s.justificationAttachment) {
            initial[s.id] = {
              reason: s.justificationReason ?? '',
              note: s.justificationNote ?? '',
              attachment: s.justificationAttachment ?? '',
            }
          }
        }
        setJustifications(initial)
      })
      .catch((err) => error('No se pudo cargar la lista', (err as Error).message))
  }

  useEffect(() => {
    loadRoster()
    setHistory(null)
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

  const updateJustification = (studentId: number, patch: Partial<Justification>) =>
    setJustifications((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] ?? emptyJustification()), ...patch },
    }))

  const save = async () => {
    setSaving(true)
    try {
      const entries = roster.students.filter((s) => marks[s.id]).map((s) => {
        const j = justifications[s.id]
        return {
          studentId: s.id,
          status: marks[s.id],
          ...(j && (j.reason || j.note || j.attachment)
            ? {
                justificationReason: j.reason || undefined,
                justificationNote: j.note || undefined,
                justificationAttachment: j.attachment || undefined,
              }
            : {}),
        }
      })
      const result = await attendanceApi.save({ sectionId, date, entries })
      setStats(result)
      success('Asistencia guardada', `Asistencia de la sección: ${formatPercent(result.rate)}`)
      onSaved?.(result)
      setHistory(null)
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const revert = async (studentId?: number) => {
    try {
      const query = new URLSearchParams({ sectionId: String(sectionId), date })
      if (studentId) query.set('studentId', String(studentId))
      const result = await unwrap(
        del<AttendanceStats & { deleted: number }>(`/attendance?${query.toString()}`),
      )
      success('Asistencia revertida', `${result.deleted} marca(s) eliminada(s).`)
      setStats(result)
      onSaved?.(result)
      loadRoster()
      setHistory(null)
    } catch (err) {
      error('No se pudo revertir', (err as Error).message)
    }
  }

  const loadHistory = async () => {
    try {
      const from = new Date(`${date}T00:00:00Z`)
      from.setUTCDate(from.getUTCDate() - 60)
      setHistory(
        await unwrap(
          get<AttendanceHistory>('/attendance/history', {
            sectionId,
            from: from.toISOString().slice(0, 10),
            to: date,
          }),
        ),
      )
    } catch (err) {
      error('No se pudo cargar el historial', (err as Error).message)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        <Button variant="soft" size="sm" icon={<CheckCheck className="h-4 w-4" />} onClick={allPresent}>
          Todos presentes
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<History className="h-4 w-4" />}
          onClick={() => (history ? setHistory(null) : loadHistory())}
        >
          Historial
        </Button>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <span key={s} className={cn('pill', TONE_CLASSES[ATTENDANCE[s].tone])}>
              [{ATTENDANCE[s].short}] {ATTENDANCE[s].label}: {counts[s]}
            </span>
          ))}
        </div>
      </div>

      {roster.taken && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" icon={<RotateCcw className="h-4 w-4" />} onClick={() => revert()}>
            Revertir día
          </Button>
        </div>
      )}

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
              <th className="w-10 text-center">J</th>
            </tr>
          </thead>
          <tbody>
            {roster.students.map((st) => {
              const marked = marks[st.id]
              const j = justifications[st.id]
              const hasJustification = Boolean(j && (j.reason || j.note || j.attachment))
              return (
                <Fragment key={st.id}>
                  <tr>
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
                            marked === s ? ACTIVE[s] : 'border-line bg-surface text-ink-3 hover:border-violet-300',
                          )}
                        >
                          {ATTENDANCE[s].short}
                        </button>
                      </td>
                    ))}
                    <td className="text-center">
                      {marked && marked !== 'PRESENT' ? (
                        <button
                          onClick={() => setJustifying(justifying === st.id ? null : st.id)}
                          aria-label={`Justificar a ${st.firstName}`}
                          title="Justificación"
                          className={cn(
                            'grid h-9 w-9 place-items-center rounded-xl border-2 transition',
                            hasJustification || justifying === st.id
                              ? 'border-blue-500 bg-blue-500 text-white'
                              : 'border-line bg-surface text-ink-3 hover:border-blue-300',
                          )}
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                  {justifying === st.id && (
                    <tr>
                      <td colSpan={STATUSES.length + 3}>
                        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-2 p-2">
                          <Select
                            value={j?.reason ?? ''}
                            onChange={(e) => updateJustification(st.id, { reason: e.target.value })}
                            options={REASONS}
                            placeholder="Motivo"
                            className="w-44"
                            aria-label="Motivo de la justificación"
                          />
                          <Input
                            value={j?.note ?? ''}
                            onChange={(e) => updateJustification(st.id, { note: e.target.value })}
                            placeholder="Detalle (opcional)"
                            className="min-w-44 flex-1"
                            aria-label="Detalle de la justificación"
                          />
                          <Input
                            value={j?.attachment ?? ''}
                            onChange={(e) => updateJustification(st.id, { attachment: e.target.value })}
                            placeholder="Soporte: URL o referencia (opcional)"
                            className="min-w-52 flex-1"
                            aria-label="Referencia del soporte"
                          />
                          <button className="icon-btn" onClick={() => setJustifying(null)} aria-label="Cerrar justificación">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {history && (
        <div className="rounded-2xl border border-line p-3">
          <p className="mb-2 text-xs font-bold uppercase text-ink-3">
            Historial de los últimos 60 días ({history.total})
          </p>
          {history.records.length ? (
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
              {history.records.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 border-b border-line py-1 last:border-0">
                  <span className="font-mono text-ink-3">{r.date}</span>
                  <span className="font-medium text-ink">
                    {r.student.lastName}, {r.student.firstName}
                  </span>
                  <span className={cn('pill', TONE_CLASSES[ATTENDANCE[r.status].tone])}>
                    {ATTENDANCE[r.status].label}
                  </span>
                  {r.justificationReason && <span className="text-blue-600">{r.justificationReason.replace(/_/g, ' ')}</span>}
                  {r.justificationNote && <span className="text-ink-3">{r.justificationNote}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-ink-3">Sin registros en el rango.</p>
          )}
        </div>
      )}

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
