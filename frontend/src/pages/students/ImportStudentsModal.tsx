import { useRef, useState } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'
import { upload } from '@services/api'
import { sectionApi, type StudentInput } from '@services/educraft'
import type { Section } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Button, Modal, Select } from '@components/ui'
import { exportExcel, readSpreadsheet } from '@lib/exporters'
import { sectionLabel } from '@lib/format'
import { cn } from '@lib/cn'

const HEADERS = ['No.', 'Apellidos', 'Nombres', 'Tutor', 'Teléfono del tutor', 'Correo del tutor']

interface ImportError {
  row: number
  message: string
}

interface ImportSummary {
  rows: number
  imported: number
  skipped: number
}

type ImportMode = 'browser' | 'server'

/** Carga masiva de estudiantes: Excel en el navegador o CSV directo al servidor. */
export function ImportStudentsModal({ open, onClose, sections, defaultSectionId, onDone }: { open: boolean; onClose: () => void; sections: Section[]; defaultSectionId?: number | null; onDone: () => void }) {
  const { success, error } = useFeedback()
  const [sectionId, setSectionId] = useState<number | ''>(defaultSectionId ?? sections[0]?.id ?? '')
  const [mode, setMode] = useState<ImportMode>('browser')
  const [rows, setRows] = useState<StudentInput[]>([])
  const [saving, setSaving] = useState(false)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [errors, setErrors] = useState<ImportError[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const read = async (file: File) => {
    setSummary(null)
    setErrors([])
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

  const uploadCsv = async (file: File) => {
    if (!sectionId) {
      error('Selecciona una sección')
      return
    }
    if (!/\.csv$/i.test(file.name)) {
      error('En este modo solo se aceptan archivos .csv')
      return
    }
    setSaving(true)
    setSummary(null)
    setErrors([])
    try {
      const form = new FormData()
      form.set('file', file)
      const res = await upload<ImportSummary & { errors?: ImportError[] }>(`/sections/${sectionId}/students/import-file`, form)
      setSummary({ rows: res.rows, imported: res.imported, skipped: res.skipped })
      setErrors(res.errors ?? [])
      success('Importación completada', `${res.imported} estudiantes registrados, ${res.skipped} omitidos`)
      setRows([])
      onDone()
    } catch (err) {
      error('No se pudo importar el CSV', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const pick = (file: File | undefined) => {
    if (!file) return
    if (mode === 'server') void uploadCsv(file)
    else void read(file)
  }

  const save = async () => {
    if (!sectionId || !rows.length) return
    setSaving(true)
    setErrors([])
    try {
      const res = (await sectionApi.importStudents(Number(sectionId), rows)) as ImportSummary & { errors?: ImportError[] }
      setSummary({ rows: rows.length, imported: res.imported, skipped: res.skipped })
      setErrors(res.errors ?? [])
      success('Importación completada', `${res.imported} estudiantes registrados, ${res.skipped} omitidos`)
      setRows([])
      onDone()
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
      title="Importar estudiantes"
      subtitle="Excel se procesa en el navegador; CSV se valida en el servidor."
      footer={
        <>
          <Button variant="secondary" onClick={() => exportExcel([{ name: 'Estudiantes', header: HEADERS, rows: [[1, 'Pérez Santos', 'Ana María', 'María Santos', '809-555-0101', '']] }], 'plantilla-estudiantes')} icon={<FileSpreadsheet className="h-4 w-4" />}>
            Descargar plantilla
          </Button>
          {mode === 'browser' && (
            <Button onClick={save} loading={saving} disabled={!rows.length}>
              Importar {rows.length ? `(${rows.length})` : ''}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-3">
        <Select value={sectionId} onChange={(e) => setSectionId(Number(e.target.value))} options={sections.map((s) => ({ value: s.id, label: sectionLabel(s.grade.name, s.name) }))} className="w-auto" />
        <div className="flex gap-2">
          {([['browser', 'Excel (navegador)'], ['server', 'CSV (servidor)']] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => { setMode(value); setRows([]); setSummary(null); setErrors([]) }}
              className={cn('rounded-xl px-3 py-2 text-xs font-semibold', mode === value ? 'bg-soft-purple text-brand-purple' : 'bg-surface-2 text-ink-3 hover:text-ink')}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            pick(e.dataTransfer.files?.[0])
          }}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 p-8 text-sm text-ink-2 hover:bg-surface-2 dark:border-violet-900"
        >
          <Upload className="h-6 w-6 text-brand-purple" />
          {mode === 'server' ? 'Arrastra un archivo .csv o haz clic para subirlo' : 'Arrastra un archivo .xlsx o .csv, o haz clic para seleccionarlo'}
          <span className="text-xs text-ink-3">Columnas: {HEADERS.join(' · ')}</span>
        </button>
        <input ref={fileRef} type="file" accept={mode === 'server' ? '.csv,text/csv' : '.xlsx,.csv'} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        {summary && (
          <p className="text-xs text-ink-2">
            Filas: {summary.rows} · importados: <span className="font-bold text-brand-green">{summary.imported}</span> · omitidos: {summary.skipped}
          </p>
        )}
        {errors.length > 0 && (
          <div className="max-h-40 space-y-1 overflow-auto rounded-2xl border border-brand-red/30 bg-soft-pink/40 p-3 text-xs text-brand-red">
            <p className="font-bold">Filas con errores</p>
            {errors.map((item, i) => (
              <p key={`${item.row}-${i}`}>Fila {item.row}: {item.message}</p>
            ))}
          </div>
        )}
        {mode === 'browser' && rows.length > 0 && (
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
