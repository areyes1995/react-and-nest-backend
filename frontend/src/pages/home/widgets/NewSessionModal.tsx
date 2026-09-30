import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, FileText, Sparkles } from 'lucide-react'
import { aiApi, sectionApi } from '@services/educraft'
import type { LessonPlan, Presentation, Section } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Button, Field, Input, Modal, Select } from '@components/ui'
import { Robot } from '@components/brand/Illustrations'
import { SlideView } from '@/features/classes/SlideView'
import { SourceBadge } from '@/features/common/SourceBadge'
import { sectionLabel, today } from '@lib/format'
import { cn } from '@lib/cn'

/**
 * "Nueva sesión": lienzo 16:9 con asistente IA lateral. Al escribir el
 * tema, la IA crea el plan (Propósito, Inicio, Desarrollo, Cierre) y lo
 * distribuye en diapositivas pastel utilizables.
 */
export function NewSessionModal({
  open,
  onClose,
  sections,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  sections: Array<{ id: number; name: string; grade: string }>
  onCreated?: () => void
}) {
  const navigate = useNavigate()
  const { error } = useFeedback()
  const [topic, setTopic] = useState('')
  const [sectionId, setSectionId] = useState<number | ''>('')
  const [detail, setDetail] = useState<Section | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ plan: LessonPlan; presentation: Presentation; source: 'ai' | 'template' } | null>(null)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (open && !sectionId && sections.length) setSectionId(sections[0].id)
    if (!open) {
      setResult(null)
      setTopic('')
      setCurrent(0)
    }
  }, [open, sections, sectionId])

  useEffect(() => {
    if (sectionId) sectionApi.get(Number(sectionId)).then(setDetail).catch(() => setDetail(null))
  }, [sectionId])

  const generate = async () => {
    if (!topic.trim() || !detail) return
    setLoading(true)
    try {
      const planRes = await aiApi.lessonPlan({ gradeId: detail.gradeId, sectionId: detail.id, topic, date: today(), save: true })
      const plan = planRes.plan as LessonPlan
      const pres = await aiApi.presentation(plan.id)
      setResult({ plan, presentation: pres.presentation, source: planRes.source })
      setCurrent(0)
      onCreated?.()
    } catch (err) {
      error('No se pudo crear la sesión', (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const slides = result?.presentation.slides ?? []
  return (
    <Modal open={open} onClose={onClose} size="full" title="Nueva sesión" subtitle="Editor de presentaciones con asistente de IA">
      <div className="grid h-full gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-3">
          {slides.length ? (
            <>
              <SlideView slide={slides[current]} number={current + 1} />
              <div className="flex gap-2 overflow-x-auto pb-1">
                {slides.map((s, i) => (
                  <button key={s.id} onClick={() => setCurrent(i)} className={cn('w-36 shrink-0 rounded-xl p-0.5 transition', i === current ? 'ring-2 ring-brand-pink' : 'opacity-80 hover:opacity-100')}>
                    <SlideView slide={s} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="grid aspect-video w-full place-items-center rounded-2xl border-2 border-dashed border-violet-200 bg-gradient-to-br from-white to-violet-50 dark:border-violet-900 dark:from-surface dark:to-violet-950/30">
              <div className="text-center">
                <p className="text-sm font-semibold text-ink-3">Lienzo 16:9</p>
                <p className="mt-1 text-xs text-ink-3">Tu presentación aparecerá aquí.</p>
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-3 rounded-2xl bg-gradient-to-b from-pink-50 to-violet-50 p-4 dark:from-pink-950/30 dark:to-violet-950/30">
          <div className="flex items-center gap-2">
            <Robot size={48} />
            <p className="text-sm font-bold text-violet-950 dark:text-violet-100">¿Qué tema vas a enseñar hoy?</p>
          </div>
          <Field label="Tema">
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && generate()} placeholder="Ej.: Sistemas de ecuaciones" autoFocus />
          </Field>
          <Field label="Sección">
            <Select value={sectionId} onChange={(e) => setSectionId(Number(e.target.value))} options={sections.map((s) => ({ value: s.id, label: sectionLabel(s.grade, s.name) }))} />
          </Field>
          <Button onClick={generate} loading={loading} disabled={!topic.trim() || !detail} icon={<Sparkles className="h-4 w-4" />}>
            Crear sesión con IA
          </Button>
          {!sections.length && <p className="text-xs text-ink-3">Primero crea una sección en Ajustes → Secciones.</p>}
          {result && (
            <div className="space-y-2 rounded-xl bg-surface p-3 text-xs text-ink-2 shadow-sm">
              <SourceBadge source={result.source} />
              <p>
                <b className="text-ink">Propósito:</b> {result.plan.purpose}
              </p>
              <p>
                {result.plan.moments.map((m) => `${m.moment.charAt(0)}${m.moment.slice(1).toLowerCase()} (${m.minutes} min)`).join(' · ')}
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <Button size="sm" icon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => { onClose(); navigate(`/app/clases/presentaciones/${result.presentation.id}`) }}>
                  Abrir en el editor
                </Button>
                <Button size="sm" variant="secondary" icon={<FileText className="h-3.5 w-3.5" />} onClick={() => { onClose(); navigate(`/app/planificacion/planes/${result.plan.id}`) }}>
                  Ver plan de clase
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </Modal>
  )
}
