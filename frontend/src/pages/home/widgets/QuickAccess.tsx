import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarRange, CheckSquare, ClipboardList, FileText, FolderOpen, Plus } from 'lucide-react'
import type { Dashboard } from '@services/types'
import { Card, CardHeader, Popover, Modal, Select } from '@components/ui'
import { Robot } from '@components/brand/Illustrations'
import { AttendanceTaker } from '@/features/attendance/AttendanceTaker'
import { GradeRegisterSheet } from '@/features/grades/GradeRegisterSheet'
import { ResourceExplorerDrawer } from '@/features/resources/ResourceExplorer'
import { sectionLabel } from '@lib/format'
import { cn } from '@lib/cn'
import { NewSessionModal } from './NewSessionModal'
import { CreateEvaluationModal } from './CreateEvaluationModal'
import { QuickAiMenu, QuickResultModal, type QuickResult } from './QuickAiMenu'

type Dialog = 'session' | 'evaluation' | 'attendance' | 'grades' | 'resources' | null

const ITEMS = [
  { key: 'session', label: 'Nueva sesión', icon: <Plus className="h-5 w-5" />, className: 'bg-brand-gradient text-white' },
  { key: 'evaluation', label: 'Crear evaluación', icon: <ClipboardList className="h-5 w-5" />, className: 'bg-soft-purple text-violet-600' },
  { key: 'planner', label: 'Planificador', icon: <CalendarRange className="h-5 w-5" />, className: 'bg-soft-orange text-orange-500' },
  { key: 'attendance', label: 'Asistencia', icon: <CheckSquare className="h-5 w-5" />, className: 'bg-soft-green text-emerald-500' },
  { key: 'grades', label: 'Notas', icon: <FileText className="h-5 w-5" />, className: 'bg-soft-blue text-blue-500' },
  { key: 'resources', label: 'Recursos', icon: <FolderOpen className="h-5 w-5" />, className: 'bg-soft-purple text-fuchsia-500' },
] as const

export function QuickAccess({ dashboard, onChange }: { dashboard: Dashboard; onChange: () => void }) {
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [quickResult, setQuickResult] = useState<QuickResult | null>(null)
  // Clase en curso (o la próxima) para precargar la lista.
  const current = dashboard.todayClasses.find((c) => c.status === 'EN_PROGRESO') ?? dashboard.todayClasses.find((c) => c.status === 'PROXIMA')
  const [sectionId, setSectionId] = useState<number | null>(current?.section?.id ?? dashboard.sections[0]?.id ?? null)
  const sectionOptions = dashboard.sections.map((s) => ({ value: s.id, label: sectionLabel(s.grade, s.name) }))

  const open = (key: (typeof ITEMS)[number]['key']) => {
    if (key === 'planner') navigate('/app/planificacion?tab=planificador&vista=periodo')
    else setDialog(key)
  }

  return (
    <Card className="card-pad">
      <CardHeader title="Accesos rápidos" />
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {ITEMS.map((item) => (
          <button key={item.key} onClick={() => open(item.key)} className="group flex flex-col items-center gap-2 rounded-2xl p-2 transition hover:bg-surface-2">
            <span className={cn('grid h-12 w-12 place-items-center rounded-2xl shadow-sm transition group-hover:-translate-y-0.5', item.className)}>{item.icon}</span>
            <span className="text-center text-[0.72rem] font-semibold text-ink-2">{item.label}</span>
          </button>
        ))}
        <Popover
          align="right"
          width="w-72"
          trigger={({ toggle }) => (
            <button onClick={toggle} className="group flex w-full flex-col items-center gap-2 rounded-2xl p-2 transition hover:bg-surface-2">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-soft-pink shadow-sm transition group-hover:-translate-y-0.5">
                <Robot size={40} />
              </span>
              <span className="text-center text-[0.72rem] font-semibold text-ink-2">IA Educraft</span>
            </button>
          )}
        >
          {(close) => <QuickAiMenu onClose={close} onResult={setQuickResult} />}
        </Popover>
      </div>

      <NewSessionModal open={dialog === 'session'} onClose={() => setDialog(null)} sections={dashboard.sections} onCreated={onChange} />
      <CreateEvaluationModal open={dialog === 'evaluation'} onClose={() => setDialog(null)} />

      <Modal
        open={dialog === 'attendance'}
        onClose={() => setDialog(null)}
        size="lg"
        title="Pase de Lista del Día"
        subtitle={current?.section ? `Clase detectada: ${sectionLabel(current.section.grade, current.section.name)}` : 'Selecciona la sección'}
      >
        <div className="mb-3">
          <Select value={sectionId ?? ''} onChange={(e) => setSectionId(Number(e.target.value))} options={sectionOptions} className="w-auto" />
        </div>
        {sectionId ? <AttendanceTaker sectionId={sectionId} compact onSaved={onChange} /> : <p className="text-sm text-ink-3">Crea una sección en Ajustes para pasar lista.</p>}
      </Modal>

      <Modal open={dialog === 'grades'} onClose={() => { setDialog(null); onChange() }} size="full" title="Registro de Calificaciones">
        <div className="mb-3">
          <Select value={sectionId ?? ''} onChange={(e) => setSectionId(Number(e.target.value))} options={sectionOptions} className="w-auto" />
        </div>
        {sectionId && <GradeRegisterSheet key={sectionId} sectionId={sectionId} compact />}
      </Modal>

      <ResourceExplorerDrawer open={dialog === 'resources'} onClose={() => setDialog(null)} />
      <QuickResultModal result={quickResult} onClose={() => setQuickResult(null)} />
    </Card>
  )
}
