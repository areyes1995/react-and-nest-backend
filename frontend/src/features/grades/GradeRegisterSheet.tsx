import { useEffect, useMemo, useRef, useState } from 'react'
import { Calculator, Download, FileSpreadsheet, Save, Upload } from 'lucide-react'
import { gradesApi } from '@services/educraft'
import type { FinalEntry, GradeEntry, GradeRegister } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Badge, Button, ErrorState, Spinner, Tabs } from '@components/ui'
import { BLOCK_SHORT, scoreTone } from '@lib/labels'
import { exportExcel, readSpreadsheet } from '@lib/exporters'
import { cn } from '@lib/cn'
import { formatScore, sectionLabel, slugify } from '@lib/format'
import { summarize, templateColumn } from './gradeMath'

type Key = string // `${studentId}-${period}-${block}-${'s'|'r'}`
type FinalKey = string // `${studentId}-${field}`

const TONE_TEXT: Record<string, string> = {
  green: 'text-emerald-600',
  blue: 'text-blue-600',
  yellow: 'text-amber-600',
  red: 'text-red-600',
  gray: 'text-ink-3',
}

function ScoreInput({ value, onChange, className }: { value: number | null; onChange: (v: number | null) => void; className?: string }) {
  const [text, setText] = useState(value == null ? '' : String(value))
  useEffect(() => setText(value == null ? '' : String(value)), [value])
  return (
    <input
      inputMode="decimal"
      value={text}
      onChange={(e) => setText(e.target.value.replace(/[^\d.,]/g, ''))}
      onBlur={() => {
        const n = text === '' ? null : Math.min(100, Math.max(0, Number(text.replace(',', '.'))))
        onChange(n == null || Number.isNaN(n) ? null : Math.round(n * 10) / 10)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      className={cn(
        'h-8 w-12 rounded-lg border border-transparent bg-surface-2 text-center text-xs font-semibold text-ink outline-none transition hover:border-line focus:border-brand-purple focus:bg-surface',
        className,
      )}
    />
  )
}

/**
 * Registro de calificaciones (plantilla oficial MINERD): P y RP por
 * periodo en cada bloque de competencias, promedios PC, C.F. y las
 * calificaciones completiva, extraordinaria y especial.
 */
export function GradeRegisterSheet({ sectionId, compact }: { sectionId: number; compact?: boolean }) {
  const { success, error, confirm } = useFeedback()
  const [data, setData] = useState<GradeRegister | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<'1' | '2' | '3' | '4' | 'final'>('1')
  const [edits, setEdits] = useState<Record<Key, number | null>>({})
  const [finalEdits, setFinalEdits] = useState<Record<FinalKey, number | null>>({})
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoadError(null)
    gradesApi
      .register(sectionId)
      .then((d) => {
        setData(d)
        setEdits({})
        setFinalEdits({})
      })
      .catch((err) => setLoadError((err as Error).message))
  }
  useEffect(load, [sectionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filas con las ediciones aplicadas y resumen recalculado en vivo.
  const rows = useMemo(() => {
    if (!data) return []
    return data.rows.map((row) => {
      const map = new Map<string, GradeEntry>()
      for (const e of row.entries) map.set(`${e.period}-${e.block}`, { ...e })
      for (const [key, value] of Object.entries(edits)) {
        const [sid, p, b, kind] = key.split('-')
        if (Number(sid) !== row.student.id) continue
        const k = `${p}-${b}`
        const entry = map.get(k) ?? { period: Number(p), block: Number(b), score: null, recovery: null }
        if (kind === 's') entry.score = value
        else entry.recovery = value
        map.set(k, entry)
      }
      const final: FinalEntry = {
        completiveScore: row.final?.completiveScore ?? null,
        extraordinaryScore: row.final?.extraordinaryScore ?? null,
        specialScore: row.final?.specialScore ?? null,
      }
      for (const [key, value] of Object.entries(finalEdits)) {
        const [sid, field] = key.split('-')
        if (Number(sid) === row.student.id) (final as unknown as Record<string, number | null>)[field] = value
      }
      const entries = [...map.values()]
      return { ...row, entries, final, summary: summarize(entries, final, data.section.passing) }
    })
  }, [data, edits, finalEdits])

  const dirty = Object.keys(edits).length + Object.keys(finalEdits).length

  if (loadError) return <ErrorState message={loadError} onRetry={load} />
  if (!data) return <Spinner />

  const valueOf = (row: (typeof rows)[number], period: number, block: number, kind: 's' | 'r') => {
    const e = row.entries.find((x) => x.period === period && x.block === block)
    return kind === 's' ? e?.score ?? null : e?.recovery ?? null
  }

  const save = async () => {
    setSaving(true)
    try {
      const entries = Object.entries(edits).reduce<Record<string, { studentId: number; period: number; block: number; score?: number | null; recovery?: number | null }>>(
        (acc, [key, value]) => {
          const [sid, p, b, kind] = key.split('-')
          const k = `${sid}-${p}-${b}`
          acc[k] ??= { studentId: Number(sid), period: Number(p), block: Number(b) }
          if (kind === 's') acc[k].score = value
          else acc[k].recovery = value
          return acc
        },
        {},
      )
      let result = data
      if (Object.keys(entries).length) result = await gradesApi.save(sectionId, Object.values(entries))
      if (Object.keys(finalEdits).length) {
        const finals = Object.entries(finalEdits).reduce<Record<number, { studentId: number } & Partial<FinalEntry>>>((acc, [key, value]) => {
          const [sid, field] = key.split('-')
          acc[Number(sid)] ??= { studentId: Number(sid) }
          ;(acc[Number(sid)] as Record<string, number | null>)[field] = value
          return acc
        }, {})
        result = await gradesApi.saveFinals(sectionId, Object.values(finals))
      }
      setData(result)
      setEdits({})
      setFinalEdits({})
      success('Calificaciones guardadas')
    } catch (err) {
      error('No se pudieron guardar', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const recalc = async () => {
    const ok = await confirm({
      title: 'Recalcular desde las actividades',
      description: 'Se calcularán las notas P de cada periodo a partir de las actividades evaluadas (promedio ponderado). Las notas escritas a mano se conservan.',
      confirmLabel: 'Recalcular',
    })
    if (!ok) return
    try {
      const res = await gradesApi.recalculate(sectionId)
      success('Notas recalculadas', `${res.updated} celdas actualizadas`)
      load()
    } catch (err) {
      error('No se pudo recalcular', (err as Error).message)
    }
  }

  const exportOfficial = () => {
    const header = [
      'No.',
      'APELLIDOS',
      'NOMBRE',
      ...[1, 2, 3, 4].flatMap((b) => [1, 2, 3, 4].flatMap((p) => [`C${b} P${p}`, `C${b} RP`])),
      'PC1',
      'PC2',
      'PC3',
      'PC4',
      'C.F.',
      '50% C.F.',
      'C.E.C.',
      '50% C.E.C.',
      'C.C.F.',
      '30% C.F.',
      'C.E.EX',
      '70% C.E.EX',
      'C.EX.F.',
      'C.E.',
      'A',
      'R',
    ]
    const body = rows.map((r) => {
      const s = r.summary
      const cf = s.finalScore
      return [
        r.student.listNumber ?? '',
        r.student.lastName,
        r.student.firstName,
        ...[1, 2, 3, 4].flatMap((b) => [1, 2, 3, 4].flatMap((p) => [valueOf(r, p, b, 's'), valueOf(r, p, b, 'r')])),
        s.blockAverages[1],
        s.blockAverages[2],
        s.blockAverages[3],
        s.blockAverages[4],
        cf,
        s.completiveFinal != null && cf != null ? cf * 0.5 : null,
        r.final.completiveScore,
        r.final.completiveScore != null ? r.final.completiveScore * 0.5 : null,
        s.completiveFinal,
        s.extraordinaryFinal != null && cf != null ? cf * 0.3 : null,
        r.final.extraordinaryScore,
        r.final.extraordinaryScore != null ? r.final.extraordinaryScore * 0.7 : null,
        s.extraordinaryFinal,
        r.final.specialScore,
        s.situation === 'A' ? 'X' : '',
        s.situation === 'R' ? 'X' : '',
      ]
    })
    const label = sectionLabel(data.section.grade.name, data.section.name)
    void exportExcel(
      [{ name: 'Matemáticas', title: `Registro de calificaciones — Matemáticas · ${label} · ${data.section.schoolYear}`, header, rows: body, widths: [5, 18, 16] }],
      `registro-${slugify(label)}`,
    )
  }

  const importFile = async (file: File) => {
    try {
      const matrix = await readSpreadsheet(file)
      const next: Record<Key, number | null> = { ...edits }
      let matched = 0
      for (const line of matrix) {
        const listNumber = Number(line[0])
        const last = (line[1] ?? '').toString().trim().toLowerCase()
        const first = (line[2] ?? '').toString().trim().toLowerCase()
        const row = data.rows.find(
          (r) =>
            (listNumber && r.student.listNumber === listNumber) ||
            (last && r.student.lastName.toLowerCase() === last && (!first || r.student.firstName.toLowerCase() === first)),
        )
        if (!row) continue
        let any = false
        for (let i = 0; i < 32; i++) {
          const raw = line[3 + i]
          if (raw == null || String(raw).trim() === '') continue
          const n = Number(String(raw).replace(',', '.'))
          if (!Number.isFinite(n)) continue
          const { block, period, recovery } = templateColumn(i)
          next[`${row.student.id}-${period}-${block}-${recovery ? 'r' : 's'}`] = Math.min(100, Math.max(0, n))
          any = true
        }
        if (any) matched++
      }
      setEdits(next)
      if (matched) success('Archivo importado', `${matched} estudiante(s) con notas. Revisa y guarda los cambios.`)
      else error('No se encontraron coincidencias', 'Usa la plantilla oficial: No., Apellidos, Nombre y columnas P/RP por competencia.')
    } catch (err) {
      error('No se pudo leer el archivo', (err as Error).message)
    }
  }

  const block = tab === 'final' ? null : Number(tab)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            ...data.blocks.map((b) => ({ key: String(b.block) as '1', label: `${b.code} · ${BLOCK_SHORT[b.block]}` })),
            { key: 'final' as const, label: 'Resumen final' },
          ]}
        />
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={<Calculator className="h-3.5 w-3.5" />} onClick={recalc}>
            Recalcular desde actividades
          </Button>
          <Button variant="secondary" size="sm" icon={<Upload className="h-3.5 w-3.5" />} onClick={() => fileRef.current?.click()}>
            Importar Excel
          </Button>
          <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={exportOfficial}>
            Exportar
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) void importFile(f)
            }}
          />
          <Button size="sm" onClick={save} loading={saving} disabled={!dirty} icon={<Save className="h-3.5 w-3.5" />}>
            Guardar{dirty ? ` (${dirty})` : ''}
          </Button>
        </div>
      </div>

      {block && <p className="text-xs text-ink-3">{data.blocks.find((b) => b.block === block)?.name} — P: calificación del periodo · RP: recuperación pedagógica (cuenta la mayor).</p>}

      <div className={cn('overflow-auto rounded-2xl border border-line', compact ? 'max-h-[58vh]' : 'max-h-[68vh]')}>
        <table className="table min-w-[48rem]">
          <thead>
            <tr>
              <th className="w-10">No.</th>
              <th className="min-w-[12rem]">Estudiante</th>
              {block ? (
                <>
                  {[1, 2, 3, 4].map((p) => (
                    <th key={p} colSpan={2} className="text-center">
                      Periodo {p}
                      <div className="mt-0.5 flex justify-around text-[0.6rem] text-ink-3">
                        <span>P{p}</span>
                        <span>RP</span>
                      </div>
                    </th>
                  ))}
                  <th className="text-center">PC{block}</th>
                </>
              ) : (
                <>
                  {[1, 2, 3, 4].map((b) => (
                    <th key={b} className="text-center">
                      PC{b}
                    </th>
                  ))}
                  <th className="text-center">C.F.</th>
                  <th className="text-center">C.E.C.</th>
                  <th className="text-center">C.C.F.</th>
                  <th className="text-center">C.E.EX</th>
                  <th className="text-center">C.EX.F.</th>
                  <th className="text-center">C.E.</th>
                  <th className="text-center">Situación</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = r.summary
              return (
                <tr key={r.student.id} className={cn(!r.student.isActive && 'opacity-50')}>
                  <td className="text-ink-3">{r.student.listNumber}</td>
                  <td className="font-medium text-ink">
                    {r.student.lastName}, {r.student.firstName}
                  </td>
                  {block ? (
                    <>
                      {[1, 2, 3, 4].map((p) =>
                        (['s', 'r'] as const).map((kind) => (
                          <td key={`${p}${kind}`} className="px-1 text-center">
                            <ScoreInput
                              value={valueOf(r, p, block, kind)}
                              onChange={(v) => setEdits((ed) => ({ ...ed, [`${r.student.id}-${p}-${block}-${kind}`]: v }))}
                              className={cn(kind === 'r' && 'bg-soft-blue', edits[`${r.student.id}-${p}-${block}-${kind}`] !== undefined && 'ring-2 ring-pink-300')}
                            />
                          </td>
                        )),
                      )}
                      <td className={cn('text-center font-bold', TONE_TEXT[scoreTone(s.blockAverages[block], data.section.passing)])}>
                        {formatScore(s.blockAverages[block])}
                      </td>
                    </>
                  ) : (
                    <>
                      {[1, 2, 3, 4].map((b) => (
                        <td key={b} className={cn('text-center font-semibold', TONE_TEXT[scoreTone(s.blockAverages[b], data.section.passing)])}>
                          {formatScore(s.blockAverages[b])}
                        </td>
                      ))}
                      <td className={cn('text-center font-extrabold', TONE_TEXT[scoreTone(s.finalScore, data.section.passing)])}>{formatScore(s.finalScore)}</td>
                      {(['completiveScore', 'extraordinaryScore', 'specialScore'] as const).map((field, i) => (
                        <FinalCells
                          key={field}
                          value={r.final[field]}
                          enabled={s.finalScore != null && s.finalScore < data.section.passing && (i === 0 || (i === 1 ? (s.completiveFinal ?? 100) < data.section.passing : (s.extraordinaryFinal ?? 100) < data.section.passing))}
                          computed={i === 0 ? s.completiveFinal : i === 1 ? s.extraordinaryFinal : null}
                          showComputed={i < 2}
                          onChange={(v) => setFinalEdits((ed) => ({ ...ed, [`${r.student.id}-${field}`]: v }))}
                        />
                      ))}
                      <td className="text-center">
                        {s.situation === 'A' ? <Badge tone="green">Aprobado</Badge> : s.situation === 'R' ? <Badge tone="red">Reprobado</Badge> : <Badge tone="gray">Pendiente</Badge>}
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-ink-3">
        <FileSpreadsheet className="h-4 w-4" />
        Promedio de la sección: <b className="text-ink">{formatScore(data.stats.average, 1)}</b> · Aprobados: {data.stats.approved} · Pendientes: {data.stats.pending} · Reprobados: {data.stats.failed} · Nota mínima: {data.section.passing}
      </div>
    </div>
  )
}

function FinalCells({
  value,
  enabled,
  computed,
  showComputed,
  onChange,
}: {
  value: number | null
  enabled: boolean
  computed: number | null
  showComputed: boolean
  onChange: (v: number | null) => void
}) {
  return (
    <>
      <td className="px-1 text-center">{enabled || value != null ? <ScoreInput value={value} onChange={onChange} /> : <span className="text-ink-3">—</span>}</td>
      {showComputed && <td className="text-center font-semibold text-ink-2">{formatScore(computed, 1)}</td>}
    </>
  )
}
