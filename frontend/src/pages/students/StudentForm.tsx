import { useEffect, useState } from 'react'
import type { Section, Student } from '@services/types'
import { sectionApi, studentApi, type StudentInput } from '@services/educraft'
import { useFeedback } from '@context/ToastContext'
import { Button, Field, Input, Modal, Select, Textarea } from '@components/ui'
import { sectionLabel } from '@lib/format'

export function StudentFormModal({
  open,
  onClose,
  student,
  sections,
  defaultSectionId,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  student?: Student | null
  sections: Section[]
  defaultSectionId?: number | null
  onSaved: () => void
}) {
  const { success, error } = useFeedback()
  const [sectionId, setSectionId] = useState<number | ''>('')
  const [form, setForm] = useState<StudentInput>({ firstName: '', lastName: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setSectionId(student?.sectionId ?? defaultSectionId ?? sections[0]?.id ?? '')
    setForm(
      student
        ? {
            firstName: student.firstName,
            lastName: student.lastName,
            listNumber: student.listNumber,
            documentId: student.documentId,
            birthDate: student.birthDate?.slice(0, 10) ?? null,
            gender: student.gender,
            guardianName: student.guardianName,
            guardianPhone: student.guardianPhone,
            guardianEmail: student.guardianEmail,
            notes: student.notes,
          }
        : { firstName: '', lastName: '' },
    )
  }, [open, student, defaultSectionId, sections])

  const set = (k: keyof StudentInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value === '' ? null : e.target.value })

  const save = async () => {
    if (!form.firstName?.trim() || !form.lastName?.trim() || !sectionId) return
    setSaving(true)
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === null ? undefined : k === 'listNumber' ? Number(v) : v])) as StudentInput
    try {
      if (student) await studentApi.update(student.id, { ...clean, sectionId: Number(sectionId) })
      else await sectionApi.addStudent(Number(sectionId), clean)
      success(student ? 'Estudiante actualizado' : 'Estudiante registrado')
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
      title={student ? 'Editar estudiante' : 'Registrar estudiante'}
      size="lg"
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
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombres">
          <Input value={form.firstName ?? ''} onChange={set('firstName')} />
        </Field>
        <Field label="Apellidos">
          <Input value={form.lastName ?? ''} onChange={set('lastName')} />
        </Field>
        <Field label="Sección">
          <Select value={sectionId} onChange={(e) => setSectionId(Number(e.target.value))} options={sections.map((s) => ({ value: s.id, label: sectionLabel(s.grade.name, s.name) }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="No. de lista">
            <Input type="number" min={1} value={form.listNumber ?? ''} onChange={set('listNumber')} />
          </Field>
          <Field label="Sexo">
            <Select value={form.gender ?? ''} onChange={set('gender')} placeholder="—" options={[{ value: 'F', label: 'Femenino' }, { value: 'M', label: 'Masculino' }]} />
          </Field>
        </div>
        <Field label="Documento / matrícula">
          <Input value={form.documentId ?? ''} onChange={set('documentId')} />
        </Field>
        <Field label="Fecha de nacimiento">
          <Input type="date" value={form.birthDate ?? ''} onChange={set('birthDate')} />
        </Field>
        <Field label="Tutor / representante">
          <Input value={form.guardianName ?? ''} onChange={set('guardianName')} />
        </Field>
        <Field label="Teléfono del tutor">
          <Input value={form.guardianPhone ?? ''} onChange={set('guardianPhone')} />
        </Field>
        <Field label="Correo del tutor" className="sm:col-span-2">
          <Input type="email" value={form.guardianEmail ?? ''} onChange={set('guardianEmail')} />
        </Field>
        <Field label="Adecuaciones o situaciones particulares" className="sm:col-span-2">
          <Textarea value={form.notes ?? ''} onChange={set('notes')} />
        </Field>
      </div>
    </Modal>
  )
}
