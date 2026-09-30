import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarPlus, CalendarRange, LayoutList } from 'lucide-react'
import { useSections } from '@hooks/useCatalog'
import { Button, PageHeader, Spinner, Tabs } from '@components/ui'
import { PlannerTab } from './PlannerTab'
import { ProgramsTab } from './ProgramsTab'

type Tab = 'planificador' | 'programaciones'

export default function PlanningPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const tab = (params.get('tab') as Tab) || 'planificador'
  const { sections, loading } = useSections()

  return (
    <div>
      <PageHeader
        title="Planificación docente"
        subtitle="Planificador inteligente y programaciones curriculares alineadas a la Adecuación Curricular"
        actions={
          <Button icon={<CalendarPlus className="h-4 w-4" />} onClick={() => navigate('/app/ajustes?tab=anio&nuevo=1')}>
            Crear Año Escolar
          </Button>
        }
      />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={(t) => setParams({ tab: t })}
        items={[
          { key: 'planificador', label: 'Planificador Inteligente', icon: <CalendarRange className="h-4 w-4" /> },
          { key: 'programaciones', label: 'Programaciones Curriculares', icon: <LayoutList className="h-4 w-4" /> },
        ]}
      />
      {loading ? <Spinner /> : tab === 'planificador' ? <PlannerTab sections={sections} initialView={params.get('vista')} /> : <ProgramsTab sections={sections} />}
    </div>
  )
}
