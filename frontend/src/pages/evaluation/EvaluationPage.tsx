import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { evaluationApi } from '@services/educraft'
import { ClipboardCheck, FileQuestion, Gauge, Library, ListChecks, Table2 } from 'lucide-react'
import { PageHeader, Tabs } from '@components/ui'
import { ExamsTab } from './ExamsTab'
import { QuestionBankTab } from './QuestionBankTab'
import { InstrumentsTab } from './InstrumentsTab'
import { AssessmentsTab } from './AssessmentsTab'

type Tab = 'examenes' | 'banco' | 'rubricas' | 'cotejo' | 'escalas' | 'actividades' | 'instrumentos'

export default function EvaluationPage() {
  const [params, setParams] = useSearchParams()
  let tab = (params.get('tab') as Tab) || 'examenes'
  const id = params.get('id') ? Number(params.get('id')) : null

  // Enlaces genéricos a un instrumento: abre la pestaña de su tipo.
  useEffect(() => {
    if (params.get('tab') !== 'instrumentos' || !id) return
    evaluationApi
      .instrument(id)
      .then((i) => setParams({ tab: i.type === 'RUBRIC' ? 'rubricas' : i.type === 'CHECKLIST' ? 'cotejo' : 'escalas', id: String(id) }, { replace: true }))
      .catch(() => setParams({ tab: 'rubricas' }, { replace: true }))
  }, [params, id, setParams])
  if (tab === 'instrumentos') tab = 'rubricas'

  return (
    <div>
      <PageHeader title="Evaluación" subtitle="Constructor de exámenes, banco de preguntas, rúbricas, listas de cotejo, escalas y calificación de actividades" />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={(t) => setParams({ tab: t })}
        items={[
          { key: 'examenes', label: 'Exámenes', icon: <FileQuestion className="h-4 w-4" /> },
          { key: 'banco', label: 'Banco de preguntas', icon: <Library className="h-4 w-4" /> },
          { key: 'rubricas', label: 'Rúbricas', icon: <Table2 className="h-4 w-4" /> },
          { key: 'cotejo', label: 'Listas de cotejo', icon: <ListChecks className="h-4 w-4" /> },
          { key: 'escalas', label: 'Escalas de valoración', icon: <Gauge className="h-4 w-4" /> },
          { key: 'actividades', label: 'Actividades y notas', icon: <ClipboardCheck className="h-4 w-4" /> },
        ]}
      />
      {tab === 'examenes' && <ExamsTab />}
      {tab === 'banco' && <QuestionBankTab />}
      {tab === 'rubricas' && <InstrumentsTab type="RUBRIC" openId={id} />}
      {tab === 'cotejo' && <InstrumentsTab type="CHECKLIST" openId={id} />}
      {tab === 'escalas' && <InstrumentsTab type="RATING_SCALE" openId={id} />}
      {tab === 'actividades' && <AssessmentsTab openId={id} />}
    </div>
  )
}
