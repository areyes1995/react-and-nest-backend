import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarCheck, Download, FileSpreadsheet, FolderOpen, Pencil, Search, Trash2, Upload, UserPlus, Users } from 'lucide-react'
import { studentApi } from '@services/educraft'
import type { Student } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useAsync } from '@hooks/useAsync'
import { useSections } from '@hooks/useCatalog'
import { useDebounce } from '@hooks/useDebounce'
import { Avatar, Button, Card, EmptyState, PageHeader, Spinner, Tabs } from '@components/ui'
import { GradeRegisterSheet } from '@/features/grades/GradeRegisterSheet'
import { exportExcel } from '@lib/exporters'
import { fullName, sectionLabel } from '@lib/format'
import { cn } from '@lib/cn'
import { StudentFormModal } from './StudentForm'
import { ImportStudentsModal } from './ImportStudentsModal'
import { AttendanceTab } from './AttendanceTab'

type Tab = 'listado' | 'asistencia' | 'calificaciones'

export default function StudentsPage() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'listado'
  const { sections, loading: loadingSections } = useSections()
  const sectionParam = params.get('seccion')
  const sectionId = sectionParam ? Number(sectionParam) : null
  const section = sections.find((s) => s.id === sectionId) ?? null
  const [q, setQ] = useState('')
  const term = useDebounce(q, 250)
  const { confirm, success, error } = useFeedback()
  const [editing, setEditing] = useState<Student | null | undefined>(undefined)
  const [importing, setImporting] = useState(false)

  const { data: students, loading, reload } = useAsync(() => studentApi.list({ sectionId: sectionId ?? undefined, q: term || undefined }), [sectionId, term])

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value == null) next.delete(key)
    else next.set(key, value)
    setParams(next)
  }

  const activeSection = section ?? (tab !== 'listado' ? sections[0] ?? null : null)
  const exportList = () =>
    exportExcel(
      [
        {
          name: 'Estudiantes',
          header: ['No.', 'Apellidos', 'Nombres', 'Sección', 'Tutor', 'Teléfono', 'Correo'],
          rows: (students ?? []).map((s) => [s.listNumber, s.lastName, s.firstName, s.section ? sectionLabel(s.section.grade.name, s.section.name) : '', s.guardianName, s.guardianPhone, s.guardianEmail]),
          widths: [5, 22, 20, 18, 22, 16, 24],
        },
      ],
      'estudiantes',
    )

  const remove = async (s: Student) => {
    if (!(await confirm({ title: 'Retirar estudiante', description: `¿Retirar a ${fullName(s)} de la sección?`, danger: true, confirmLabel: 'Retirar' }))) return
    try {
      await studentApi.remove(s.id)
      success('Estudiante retirado')
      void reload()
    } catch (err) {
      error('No se pudo retirar', (err as Error).message)
    }
  }

  const counts = useMemo(() => Object.fromEntries(sections.map((s) => [s.id, s._count.students])), [sections])

  return (
    <div>
      <PageHeader
        title="Estudiantes y seguimiento"
        subtitle="Dashboard de analítica estudiantil: listado, asistencia y registro de calificaciones"
        actions={
          tab === 'listado' && (
            <>
              <Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => setImporting(true)} disabled={!sections.length}>
                Importar
              </Button>
              <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportList}>
                Exportar
              </Button>
              <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setEditing(null)} disabled={!sections.length}>
                Registrar estudiante
              </Button>
            </>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs
          value={tab}
          onChange={(t) => setParam('tab', t)}
          items={[
            { key: 'listado', label: 'Listado', icon: <Users className="h-4 w-4" /> },
            { key: 'asistencia', label: 'Asistencia', icon: <CalendarCheck className="h-4 w-4" /> },
            { key: 'calificaciones', label: 'Calificaciones', icon: <FileSpreadsheet className="h-4 w-4" /> },
          ]}
        />
        <div className="flex flex-wrap gap-1.5">
          {tab === 'listado' && (
            <button className={cn('chip', !sectionId && 'chip-active')} onClick={() => setParam('seccion', null)}>
              Todas
            </button>
          )}
          {sections.map((s) => (
            <button key={s.id} className={cn('chip', activeSection?.id === s.id && 'chip-active')} onClick={() => setParam('seccion', String(s.id))}>
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {sectionLabel(s.grade.name, s.name)}
              <span className="text-ink-3">{counts[s.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {loadingSections ? (
        <Spinner />
      ) : !sections.length ? (
        <Card className="card-pad">
          <EmptyState title="Aún no tienes secciones" description="Crea tus secciones y su horario para registrar estudiantes." action={<Link to="/app/ajustes?tab=secciones" className="btn btn-primary btn-sm">Crear secciones</Link>} />
        </Card>
      ) : tab === 'asistencia' && activeSection ? (
        <AttendanceTab section={activeSection} />
      ) : tab === 'calificaciones' && activeSection ? (
        <Card className="card-pad">
          <GradeRegisterSheet key={activeSection.id} sectionId={activeSection.id} />
        </Card>
      ) : (
        <Card className="card-pad">
          <div className="relative mb-3 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o matrícula" className="input pl-9" />
          </div>
          {loading && !students ? (
            <Spinner />
          ) : !students?.length ? (
            <EmptyState title="Sin estudiantes" description="Registra estudiantes uno a uno o impórtalos desde Excel." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10">No.</th>
                    <th>Estudiante</th>
                    <th>Sección</th>
                    <th>Tutor</th>
                    <th>Contacto</th>
                    <th className="w-32 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className={cn(!s.isActive && 'opacity-50')}>
                      <td className="text-ink-3">{s.listNumber}</td>
                      <td>
                        <Link to={`/app/estudiantes/${s.id}`} className="flex items-center gap-2.5 font-semibold text-ink hover:text-brand-purple">
                          <Avatar name={fullName(s)} size={30} />
                          {s.lastName}, {s.firstName}
                        </Link>
                      </td>
                      <td>
                        {s.section && (
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span className="h-2 w-2 rounded-full" style={{ background: s.section.color }} />
                            {sectionLabel(s.section.grade.name, s.section.name)}
                          </span>
                        )}
                      </td>
                      <td className="text-xs">{s.guardianName ?? '—'}</td>
                      <td className="text-xs">{s.guardianPhone ?? s.guardianEmail ?? '—'}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link to={`/app/estudiantes/${s.id}`} className="icon-btn h-8 w-8" aria-label="Expediente" title="Expediente digital">
                            <FolderOpen className="h-4 w-4" />
                          </Link>
                          <button className="icon-btn h-8 w-8" onClick={() => setEditing(s)} aria-label="Editar">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button className="icon-btn h-8 w-8 hover:text-brand-red" onClick={() => remove(s)} aria-label="Retirar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <StudentFormModal open={editing !== undefined} onClose={() => setEditing(undefined)} student={editing} sections={sections} defaultSectionId={sectionId} onSaved={reload} />
      <ImportStudentsModal open={importing} onClose={() => setImporting(false)} sections={sections} defaultSectionId={sectionId} onDone={reload} />
    </div>
  )
}
