import { useEffect, useState } from 'react'
import { planningApi, type UnitInput } from '@services/educraft'
import type { LearningUnit, Section, UnitKind } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useGrades } from '@hooks/useCatalog'
import { Button, Field, Input, Modal, Select, Textarea } from '@components/ui'
import { CurriculumPicker } from '@/features/planning/CurriculumPicker'
import { UNIT_KINDS } from '@lib/labels'
import { sectionLabel } from '@lib/format'

export function UnitEditorModal({
  open,
  unit,
  defaults,
  sections,
  onClose,
  onSaved,
}: {
  open: boolean
  unit?: LearningUnit | null
  defaults?: Partial<UnitInput>
  sections: Section[]
  onClose: () => void
  onSaved: () => void
}) {
  const grades = useGrades()
  const { success, error } = useFeedback()
  const [form, setForm] = useState<UnitInput>({ gradeId: 0, title: '' })
  const [criteria, setCriteria] = useState('')
  const [evidences, setEvidences] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const base: UnitInput = unit
      ? {
          gradeId: unit.gradeId,
          schoolYearId: unit.schoolYearId ?? undefined,
          sectionId: unit.sectionId ?? undefined,
          kind: unit.kind,
          title: unit.title,
          description: unit.description ?? undefined,
          startDate: unit.startDate?.slice(0, 10),
          endDate: unit.endDate?.slice(0, 10),
          order: unit.order,
          specificCompetenceIds: unit.specificCompetenceIds,
          indicatorIds: unit.indicatorIds,
          contentIds: unit.contentIds,
        }
      : { gradeId: defaults?.gradeId ?? grades[0]?.id ?? 1, kind: 'UNIT', title: '', specificCompetenceIds: [], indicatorIds: [], contentIds: [], ...defaults }
    setForm(base)
    setCriteria((unit?.evaluationCriteria ?? []).join('\n'))
    setEvidences((unit?.evidences ?? []).join('\n'))
  }, [open, unit, defaults, grades])

  const save = async () => {
    if (!form.title.trim() || !form.gradeId) return
    setSaving(true)
    const body: UnitInput = {
      ...form,
      evaluationCriteria: criteria.split('\n').map((x) => x.trim()).filter(Boolean),
      evidences: evidences.split('\n').map((x) => x.trim()).filter(Boolean),
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    }
    try {
      if (unit) await planningApi.updateUnit(unit.id, body)
      else await planningApi.createUnit(body)
      success(unit ? 'Programación actualizada' : 'Programación creada')
      onSaved()
      onClose()
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={unit ? 'Editar programación' : 'Nueva programación curricular'}
      subtitle="Programación anual, unidad didáctica, experiencia de aprendizaje o proyecto"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as UnitKind })} options={Object.entries(UNIT_KINDS).map(([v, l]) => ({ value: v, label: l }))} />
            </Field>
            <Field label="Grado">
              <Select value={form.gradeId} onChange={(e) => setForm({ ...form, gradeId: Number(e.target.value), specificCompetenceIds: [], indicatorIds: [], contentIds: [] })} options={grades.map((g) => ({ value: g.id, label: g.name }))} />
            </Field>
          </div>
          <Field label="Título">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Unidad 1: Números racionales" />
          </Field>
          <Field label="Sección (opcional)">
            <Select value={form.sectionId ?? ''} onChange={(e) => setForm({ ...form, sectionId: e.target.value ? Number(e.target.value) : undefined })} placeholder="Todas las del grado" options={sections.filter((s) => s.gradeId === form.gradeId).map((s) => ({ value: s.id, label: sectionLabel(s.grade.name, s.name) }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inicio">
              <Input type="date" value={form.startDate ?? ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="Fin">
              <Input type="date" value={form.endDate ?? ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>
          <Field label="Descripción / situación de aprendizaje">
            <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </Field>
          <Field label="Criterios de evaluación" hint="Uno por línea">
            <Textarea value={criteria} onChange={(e) => setCriteria(e.target.value)} rows={3} />
          </Field>
          <Field label="Evidencias" hint="Una por línea">
            <Textarea value={evidences} onChange={(e) => setEvidences(e.target.value)} rows={2} />
          </Field>
        </div>
        <div>
          <p className="label">Competencias, indicadores y contenidos</p>
          <CurriculumPicker
            gradeId={form.gradeId}
            value={{ specificCompetenceIds: form.specificCompetenceIds ?? [], indicatorIds: form.indicatorIds ?? [], contentIds: form.contentIds ?? [] }}
            onChange={(v) => setForm({ ...form, ...v })}
          />
        </div>
      </div>
    </Modal>
  )
}
