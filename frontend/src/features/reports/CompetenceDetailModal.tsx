import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { reportApi } from '@services/educraft'
import type { AchievementLevel, CompetenceDetail } from '@services/types'
import { Badge, Modal, Select, Spinner, TONE_CLASSES } from '@components/ui'
import { LEVELS } from '@lib/labels'
import { cn } from '@lib/cn'
import { formatScore, sectionLabel } from '@lib/format'

const ORDER: AchievementLevel[] = ['INICIO', 'EN_PROCESO', 'LOGRADO', 'EXCELENTE']

/** Reporte detallado de logro curricular de un bloque de competencias. */
export function CompetenceDetailModal({
  open,
  onClose,
  block,
  sections,
  period,
}: {
  open: boolean
  onClose: () => void
  block: number | null
  sections: Array<{ id: number; name: string; grade: string }>
  period?: number
}) {
  const [sectionId, setSectionId] = useState<number | null>(null)
  const [data, setData] = useState<CompetenceDetail | null>(null)

  useEffect(() => {
    if (open && !sectionId && sections.length) setSectionId(sections[0].id)
  }, [open, sections, sectionId])

  useEffect(() => {
    if (!open || !block || !sectionId) return
    setData(null)
    reportApi.competence(sectionId, block, period).then(setData).catch(() => setData(null))
  }, [open, block, sectionId, period])

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Reporte detallado de logro curricular" subtitle={data?.block?.name}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          value={sectionId ?? ''}
          onChange={(e) => setSectionId(Number(e.target.value))}
          options={sections.map((s) => ({ value: s.id, label: sectionLabel(s.grade, s.name) }))}
          className="w-auto"
        />
        {data && <span className="text-sm text-ink-2">Promedio del bloque: <b>{formatScore(data.average, 1)}</b></span>}
      </div>
      {!data ? (
        <Spinner />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ORDER.map((level) => (
            <div key={level} className={cn('rounded-2xl p-3', TONE_CLASSES[LEVELS[level].tone])}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold">{LEVELS[level].label}</p>
                <Badge tone={LEVELS[level].tone} className="bg-white/70 dark:bg-black/20">
                  {data.levels[level].length}
                </Badge>
              </div>
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {data.levels[level].map((s) => (
                  <li key={s.id}>
                    <Link to={`/app/estudiantes/${s.id}`} className="flex items-center justify-between rounded-lg bg-white/70 px-2 py-1 text-xs text-ink hover:bg-white dark:bg-black/20">
                      <span className="truncate">{s.name}</span>
                      <b>{formatScore(s.score)}</b>
                    </Link>
                  </li>
                ))}
                {!data.levels[level].length && <li className="text-xs opacity-70">Sin estudiantes</li>}
              </ul>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-ink-3">Los estudiantes en “Inicio” y “En proceso” requieren actividades de nivelación.</p>
    </Modal>
  )
}
