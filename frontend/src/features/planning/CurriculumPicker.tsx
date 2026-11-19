import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useGradeCurriculum } from '@hooks/useCatalog'
import { Checkbox, Spinner, Tabs } from '@components/ui'
import type { ContentKind } from '@services/types'
import { cn } from '@lib/cn'

export interface CrossCuttingAxis {
  id: number
  code: string
  name: string
  cycle: number
  description: string
  gradeDetails: string[]
  order: number
}

export interface Capacity {
  id: number
  code: string
  gradeId: number
  specificCompetenceId: number
  description: string
  order: number
}

export interface Performance {
  id: number
  code: string
  gradeId: number
  capacityId: number
  description: string
  order: number
}

// Los tipos compartidos no son propiedad de esta tarea; se amplían aquí para
// que el selector y el exportador vean los nuevos campos del catálogo.
declare module '@services/types' {
  interface GradeCurriculum {
    axes: CrossCuttingAxis[]
    capacities: Capacity[]
    performances: Performance[]
  }
  interface ResolvedCurriculum {
    axes: CrossCuttingAxis[]
    capacities: Capacity[]
    performances: Performance[]
  }
  interface LessonPlanInput {
    axisIds?: number[]
    capacityIds?: number[]
    performanceIds?: number[]
  }
  interface LearningUnit {
    axisIds?: number[]
    capacityIds?: number[]
    performanceIds?: number[]
  }
}

declare module '@services/educraft' {
  interface UnitInput {
    axisIds?: number[]
    capacityIds?: number[]
    performanceIds?: number[]
  }
}

export interface CurriculumSelection {
  specificCompetenceIds: number[]
  indicatorIds: number[]
  contentIds: number[]
  axisIds?: number[]
  capacityIds?: number[]
  performanceIds?: number[]
}

export const EMPTY_CURRICULUM_SELECTION: CurriculumSelection = {
  specificCompetenceIds: [],
  indicatorIds: [],
  contentIds: [],
  axisIds: [],
  capacityIds: [],
  performanceIds: [],
}

type TabKey = 'competences' | 'indicators' | 'capacities' | 'performances' | 'axes' | 'contents'

const KIND_LABEL: Record<ContentKind, string> = {
  CONCEPT: 'Conceptos',
  PROCEDURE: 'Procedimientos',
  ATTITUDE: 'Actitudes y valores',
}

/**
 * Selector de la Adecuación Curricular del grado: ejes, competencias,
 * capacidades, desempeños, indicadores y contenidos. Los elementos se
 * pueden arrastrar (dataTransfer "application/x-curriculum").
 */
export function CurriculumPicker({
  gradeId,
  value,
  onChange,
  compact,
}: {
  gradeId?: number | null
  value: CurriculumSelection
  onChange: (value: CurriculumSelection) => void
  compact?: boolean
}) {
  const grade = useGradeCurriculum(gradeId)
  const [tab, setTab] = useState<TabKey>('competences')
  const [filter, setFilter] = useState('')

  const toggle = (key: keyof CurriculumSelection, id: number) => {
    const list = value[key] ?? []
    onChange({ ...value, [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] })
  }

  const match = (text: string) => !filter || text.toLowerCase().includes(filter.toLowerCase())
  const contentsByKind = useMemo(() => {
    const groups: Record<ContentKind, NonNullable<typeof grade>['contents']> = { CONCEPT: [], PROCEDURE: [], ATTITUDE: [] }
    for (const c of grade?.contents ?? []) groups[c.kind].push(c)
    return groups
  }, [grade])

  if (!gradeId) return <p className="rounded-xl bg-surface-3 p-3 text-xs text-ink-3">Selecciona un grado para ver su malla curricular.</p>
  if (!grade) return <Spinner className="py-6" />

  const axes = grade.axes ?? []
  const capacities = grade.capacities ?? []
  const performances = grade.performances ?? []
  const competenceName = (id: number) =>
    grade.specificCompetences.find((c) => c.id === id)?.fundamental.name ?? 'Competencia'
  const capacityLabel = (id: number) => {
    const capacity = capacities.find((c) => c.id === id)
    return capacity ? `${competenceName(capacity.specificCompetenceId)}: ${capacity.description}` : 'Capacidad'
  }

  const drag = (kind: string, id: number, text: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-curriculum', JSON.stringify({ kind, id, text }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { key: 'competences', label: 'Competencias', count: value.specificCompetenceIds.length },
            { key: 'capacities', label: 'Capacidades', count: value.capacityIds?.length ?? 0 },
            { key: 'performances', label: 'Desempeños', count: value.performanceIds?.length ?? 0 },
            { key: 'indicators', label: 'Indicadores', count: value.indicatorIds.length },
            { key: 'axes', label: 'Ejes', count: value.axisIds?.length ?? 0 },
            { key: 'contents', label: 'Contenidos', count: value.contentIds.length },
          ]}
        />
        <div className="relative min-w-[10rem] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrar…" className="input h-9 pl-8 text-xs" />
        </div>
      </div>
      {!compact && grade.focus && <p className="text-xs text-ink-3">Énfasis del grado: {grade.focus}</p>}

      <div className={cn('space-y-1.5 overflow-y-auto pr-1', compact ? 'max-h-64' : 'max-h-[26rem]')}>
        {tab === 'competences' &&
          grade.specificCompetences
            .filter((c) => match(c.description + c.fundamental.name))
            .map((c) => (
              <div key={c.id} draggable onDragStart={drag('competence', c.id, c.description)} className="rounded-xl border border-line bg-surface p-2.5">
                <Checkbox
                  checked={value.specificCompetenceIds.includes(c.id)}
                  onChange={() => toggle('specificCompetenceIds', c.id)}
                  label={
                    <span>
                      <span className="block text-[0.7rem] font-bold uppercase tracking-wide text-brand-purple">{c.fundamental.name}</span>
                      <span className="text-xs text-ink-2">{c.description}</span>
                    </span>
                  }
                />
              </div>
            ))}

        {tab === 'capacities' &&
          capacities
            .filter((c) => match(c.description + competenceName(c.specificCompetenceId)))
            .map((c) => (
              <div key={c.id} draggable onDragStart={drag('capacity', c.id, c.description)} className="rounded-xl border border-line bg-surface p-2.5">
                <Checkbox
                  checked={value.capacityIds?.includes(c.id) ?? false}
                  onChange={() => toggle('capacityIds', c.id)}
                  label={
                    <span>
                      <span className="block text-[0.7rem] font-bold uppercase tracking-wide text-brand-purple">{competenceName(c.specificCompetenceId)}</span>
                      <span className="text-xs text-ink-2">{c.description}</span>
                    </span>
                  }
                />
              </div>
            ))}

        {tab === 'performances' &&
          performances
            .filter((p) => match(p.description + capacityLabel(p.capacityId)))
            .map((p) => (
              <div key={p.id} draggable onDragStart={drag('performance', p.id, p.description)} className="rounded-xl border border-line bg-surface p-2.5">
                <Checkbox
                  checked={value.performanceIds?.includes(p.id) ?? false}
                  onChange={() => toggle('performanceIds', p.id)}
                  label={
                    <span>
                      <span className="block text-[0.7rem] font-bold uppercase tracking-wide text-brand-purple">{capacityLabel(p.capacityId)}</span>
                      <span className="text-xs text-ink-2">{p.description}</span>
                    </span>
                  }
                />
              </div>
            ))}

        {tab === 'indicators' &&
          grade.indicators
            .filter((i) => match(i.description))
            .map((i) => (
              <div key={i.id} draggable onDragStart={drag('indicator', i.id, i.description)} className="rounded-xl border border-line bg-surface p-2.5">
                <Checkbox checked={value.indicatorIds.includes(i.id)} onChange={() => toggle('indicatorIds', i.id)} label={<span className="text-xs text-ink-2">{i.description}</span>} />
              </div>
            ))}

        {tab === 'axes' &&
          axes
            .filter((a) => match(a.name + a.description))
            .map((a) => (
              <div key={a.id} draggable onDragStart={drag('axis', a.id, a.name)} className="rounded-xl border border-line bg-surface p-2.5">
                <Checkbox
                  checked={value.axisIds?.includes(a.id) ?? false}
                  onChange={() => toggle('axisIds', a.id)}
                  label={
                    <span>
                      <span className="block text-[0.7rem] font-bold uppercase tracking-wide text-brand-purple">Ciclo {a.cycle} · {a.name}</span>
                      <span className="block text-xs text-ink-2">{a.description}</span>
                      {!compact && a.gradeDetails.length > 0 && (
                        <span className="block text-[0.7rem] text-ink-3">{a.gradeDetails.join(' · ')}</span>
                      )}
                    </span>
                  }
                />
              </div>
            ))}

        {tab === 'contents' &&
          (Object.keys(contentsByKind) as ContentKind[]).map((kind) => {
            const list = contentsByKind[kind].filter((c) => match(c.description + (c.block ?? '')))
            if (!list.length) return null
            return (
              <div key={kind}>
                <p className="mb-1 mt-2 text-[0.7rem] font-bold uppercase tracking-wide text-ink-3">{KIND_LABEL[kind]}</p>
                <div className="space-y-1.5">
                  {list.map((c) => (
                    <div key={c.id} draggable onDragStart={drag('content', c.id, c.description)} className="rounded-xl border border-line bg-surface p-2.5">
                      <Checkbox
                        checked={value.contentIds.includes(c.id)}
                        onChange={() => toggle('contentIds', c.id)}
                        label={
                          <span className="text-xs text-ink-2">
                            {c.block && <b className="text-ink">{c.block}: </b>}
                            {c.description}
                          </span>
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
