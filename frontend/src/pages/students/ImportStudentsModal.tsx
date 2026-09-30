import { useRef, useState } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'
import { sectionApi, type StudentInput } from '@services/educraft'
import type { Section } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Button, Modal, Select } from '@components/ui'
import { exportExcel, readSpreadsheet } from '@lib/exporters'
import { sectionLabel } from '@lib/format'

const HEADERS = ['No.', 'Apellidos', 'Nombres', 'Tutor', 'Teléfono del tutor', 'Correo del tutor']

/** Carga masiva de estudiantes desde Excel/CSV. */
export function ImportStudentsModal({ open, onClose, sections, defaultSectionId, onDone }: { open: boolean; onClose: () => void; sections: Section[]; defaultSectionId?: number | null; onDone: () => void }) {
  const { success, error } = useFeedback()
  const [sectionId, setSectionId] = useState<number | ''>(defaultSectionId ?? sections[0]?.id ?? '')
  const [rows, setRows] = useState<StudentInput[]>([])
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const read = async (file: File) => {
    try {
      const matrix = await readSpreadsheet(file)
      const start = matrix.findIndex((r) => r.some((c) => /apellido/i.test(c)))
      const body = matrix.slice(start >= 0 ? start + 1 : 0)
      setRows(
        body
          .map((r) => ({
            listNumber: Number(r[0]) || undefined,
            lastName: (r[1] ?? '').trim(),
            firstName: (r[2] ?? '').trim(),
            guardianName: r[3]?.trim() || undefined,
            guardianPhone: r[4]?.trim() || undefined,
            guardianEmail: r[5]?.trim() || undefined,
          }))
          .filter((r) => r.firstName && r.lastName),
      )
    } catch (err) {
      error('No se pudo leer el archivo', (err as Error).message)
    }
  }

  const save = async () => {
    if (!sectionId || !rows.length) return
    setSaving(true)
    try {
      const res = await sectionApi.importStudents(Number(sectionId), rows)
      success('Importación completada', `${res.imported} estudiantes registrados`)
      setRows([])
      onDone()
      onClose()
    } catch (err) {
      error('No se pudo importar', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Importar estudiantes desde Excel"
      footer={
        <>
          <Button variant="secondary" onClick={() => exportExcel([{ name: 'Estudiantes', header: HEADERS, rows: [[1, 'Pérez Santos', 'Ana María', 'María Santos', '809-555-0101', '']] }], 'plantilla-estudiantes')} icon={<FileSpreadsheet className="h-4 w-4" />}>
            Descargar plantilla
          </Button>
          <Button onClick={save} loading={saving} disabled={!rows.length}>
            Importar {rows.length ? `(${rows.length})` : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Select value={sectionId} onChange={(e) => setSectionId(Number(e.target.value))} options={sections.map((s) => ({ value: s.id, label: sectionLabel(s.grade.name, s.name) }))} className="w-auto" />
        <button
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files?.[0]
            if (f) void read(f)
          }}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 p-8 text-sm text-ink-2 hover:bg-surface-2 dark:border-violet-900"
        >
          <Upload className="h-6 w-6 text-brand-purple" />
          Arrastra un archivo .xlsx o .csv, o haz clic para seleccionarlo
          <span className="text-xs text-ink-3">Columnas: {HEADERS.join(' · ')}</span>
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && read(e.target.files[0])} />
        {rows.length > 0 && (
          <div className="max-h-64 overflow-auto rounded-2xl border border-line">
            <table className="table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Apellidos</th>
                  <th>Nombres</th>
                  <th>Tutor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.listNumber ?? '—'}</td>
                    <td>{r.lastName}</td>
                    <td>{r.firstName}</td>
                    <td>{r.guardianName ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  )
}
