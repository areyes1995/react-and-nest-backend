import { useEffect, useMemo, useRef, useState } from 'react'
import { Calculator, Download, FileSpreadsheet, Lock, Save, Unlock, Upload } from 'lucide-react'
import { get, post } from '@services/api'
import { gradesApi } from '@services/educraft'
import type { FinalEntry, GradeEntry, GradeRegister } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Badge, Button, ErrorState, IconButton, Spinner, Tabs } from '@components/ui'
import {
  BLOCK_SHORT,
  SCALE_LABELS,
  parseScaleInput,
  scaleText,
  scaleValueFromInternal,
  scoreTone,
  type GradingScaleType,
} from '@lib/labels'
import { exportExcel, readSpreadsheet } from '@lib/exporters'
import { cn } from '@lib/cn'
import { formatDateTime, sectionLabel, slugify } from '@lib/format'
import { summarize, templateColumn } from './gradeMath'

type Key = string // `${studentId}-${period}-${block}-${'s'|'r'}`
type FinalKey = string // `${studentId}-${field}`

interface PeriodLockState {
  period: number
  isLocked: boolean
  reason: string | null
  lockedBy: number | null
  lockedAt: string
}

interface HistoryItem {
  id: number
  sectionId: number
  studentId: number | null
  actorId: number | null
  action: string
  entity: string
  entityId: number | null
  period: number | null
  block: number | null
  previousValue: string | null
  nextValue: string | null
  reason: string | null
  createdAt: string
  student: { id: number; listNumber: number | null; firstName: string; lastName: string } | null
}

type RegisterData = GradeRegister & {
  section: GradeRegister['section'] & {
    gradingScale?: { type: GradingScaleType; passing: number }
  }
  locks?: PeriodLockState[]
}

type Row = RegisterData['rows'][number]

const TONE_TEXT: Record<string, string> = {
  green: 'text-emerald-600',
  blue: 'text-blue-600',
  yellow: 'text-amber-600',
  red: 'text-red-600',
  gray: 'text-ink-3',
}

const ACTION_LABELS: Record<string, string> = {
  SAVE: 'Guardado',
  FINAL: 'Nota final',
  RECALCULATE: 'Recálculo',
  LOCK: 'Bloqueo',
  UNLOCK: 'Desbloqueo',
}

const ACTION_CLASSES: Record<string, string> = {
  SAVE: 'text-blue-600',
  FINAL: 'text-purple-600',
  RECALCULATE: 'text-sky-600',
  LOCK: 'text-red-600',
  UNLOCK: 'text-emerald-600',
}

const SNAPSHOT_FIELDS: Record<string, string> = {
  score: 'P',
  recovery: 'RP',
  isLocked: 'Estado',
  completiveScore: 'C.E.C.',
  extraordinaryScore: 'C.E.EX',
  specialScore: 'C.E.',
}

function formatSnapshot(raw: string | null, type: GradingScaleType): string {
  if (!raw) return '—'
  try {
    const value = JSON.parse(raw) as Record<string, unknown>
    const parts = Object.entries(value)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([field, v]) => {
        const label = SNAPSHOT_FIELDS[field] ?? field
        if (typeof v === 'number') return `${label}: ${scaleText(v, type)}`
        if (typeof v === 'boolean') return `${label}: ${v ? 'Bloqueado' : 'Abierto'}`
        return `${label}: ${String(v)}`
      })
    return parts.join(' · ') || '—'
  } catch {
    return raw
  }
}

function ScoreInput({
  text,
  onCommit,
  className,
  disabled,
}: {
  text: string
  onCommit: (text: string) => void
  className?: string
  disabled?: boolean
}) {
  const [draft, setDraft] = useState(text)
  useEffect(() => setDraft(text), [text])
  return (
    <input
      inputMode="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(draft.trim())}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      disabled={disabled}
      className={cn(
        'h-8 w-12 rounded-lg border border-transparent bg-surface-2 text-center text-xs font-semibold text-ink outline-none transition hover:border-line focus:border-brand-purple focus:bg-surface disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    />
  )
}

/**
 * Registro de calificaciones (plantilla oficial MINERD): P y RP por
 * periodo en cada bloque de competencias, promedios PC, C.F. y las
 * calificaciones completiva, extraordinaria y especial.
 * Las notas viajan en la escala declarada y se calculan en 0-100.
 */
export function GradeRegisterSheet({ sectionId, compact }: { sectionId: number; compact?: boolean }) {
  const { success, error, confirm } = useFeedback()
  const [data, setData] = useState<RegisterData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<'1' | '2' | '3' | '4' | 'final'>('1')
  const [edits, setEdits] = useState<Record<Key, number | null>>({})
  const [finalEdits, setFinalEdits] = useState<Record<FinalKey, number | null>>({})
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [recalcBlock, setRecalcBlock] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadHistory = () => {
    get<HistoryItem[]>(`/grades/sections/${sectionId}/history`, { limit: 30 })
      .then((res) => {
        if (res.ok) setHistory(res.data)
      })
      .catch(() => undefined)
  }

  const load = () => {
    setLoadError(null)
    gradesApi
      .register(sectionId)
      .then((d) => {
        setData(d as RegisterData)
        setEdits({})
        setFinalEdits({})
        loadHistory()
      })
      .catch((err) => setLoadError((err as Error).message))
  }
  useEffect(load, [sectionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const scaleType: GradingScaleType = data?.section.gradingScale?.type ?? 'NUMERIC_100'
  const locks = data?.locks ?? []
  const isLocked = (period: number) => locks.some((l) => l.period === period && l.isLocked)

  // Filas con las ediciones aplicadas y resumen recalculado en vivo (0-100).
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
  const dirtyLocked = Object.keys(edits).some((key) => isLocked(Number(key.split('-')[1])))

  if (loadError) return <ErrorState message={loadError} onRetry={load} />
  if (!data) return <Spinner />

  const valueOf = (row: Row, period: number, block: number, kind: 's' | 'r') => {
    const e = row.entries.find((x) => x.period === period && x.block === block)
    return kind === 's' ? e?.score ?? null : e?.recovery ?? null
  }
  const toApi = (value: number | null | undefined) =>
    value === undefined ? undefined : scaleValueFromInternal(value, scaleType)

  const save = async () => {
    setSaving(true)
    try {
      const entries = Object.entries(edits).reduce<Record<string, { studentId: number; period: number; block: number; score?: number | null; recovery?: number | null }>>(
        (acc, [key, value]) => {
          const [sid, p, b, kind] = key.split('-')
          const k = `${sid}-${p}-${b}`
          acc[k] ??= { studentId: Number(sid), period: Number(p), block: Number(b) }
          if (kind === 's') acc[k].score = toApi(value)
          else acc[k].recovery = toApi(value)
          return acc
        },
        {},
      )
      let result = data
      if (Object.keys(entries).length) result = await gradesApi.save(sectionId, Object.values(entries)) as RegisterData
      if (Object.keys(finalEdits).length) {
        const finals = Object.entries(finalEdits).reduce<Record<number, { studentId: number } & Partial<FinalEntry>>>((acc, [key, value]) => {
          const [sid, field] = key.split('-')
          acc[Number(sid)] ??= { studentId: Number(sid) }
          ;(acc[Number(sid)] as Record<string, number | null | undefined>)[field] = toApi(value)
          return acc
        }, {})
        result = await gradesApi.saveFinals(sectionId, Object.values(finals)) as RegisterData
      }
      setData(result)
      setEdits({})
      setFinalEdits({})
      loadHistory()
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
      const params = new URLSearchParams(recalcBlock ? { block: recalcBlock } : {})
      const res = await post<{ updated: number }>(`/grades/sections/${sectionId}/recalculate?${params.toString()}`)
      if (!res.ok) throw new Error(res.error || 'No se pudo recalcular')
      success('Notas recalculadas', `${res.data.updated} celdas actualizadas`)
      load()
    } catch (err) {
      error('No se pudo recalcular', (err as Error).message)
    }
  }

  const toggleLock = async (period: number, locked: boolean) => {
    const ok = await confirm({
      title: locked ? `Bloquear periodo ${period}` : `Desbloquear periodo ${period}`,
      description: locked
        ? 'No se podrán guardar ni recalcular calificaciones de ese periodo hasta desbloquearlo.'
        : 'Se permitirán nuevos cambios en las calificaciones del periodo.',
      confirmLabel: locked ? 'Bloquear' : 'Desbloquear',
    })
    if (!ok) return
    try {
      const res = await post<PeriodLockState[]>(
        `/grades/sections/${sectionId}/periods/${period}/${locked ? 'lock' : 'unlock'}`,
        { reason: locked ? 'Bloqueo desde el registro oficial' : 'Desbloqueo desde el registro oficial' },
      )
      if (!res.ok) throw new Error(res.error || 'No se pudo actualizar el bloqueo')
      success(locked ? `Periodo ${period} bloqueado` : `Periodo ${period} desbloqueado`)
      load()
    } catch (err) {
      error('No se pudo actualizar el bloqueo', (err as Error).message)
    }
  }

  const exportOfficial = () => {
    const out = (v: number | null | undefined) => (v == null ? null : scaleValueFromInternal(v, scaleType))
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
        ...[1, 2, 3, 4].flatMap((b) => [1, 2, 3, 4].flatMap((p) => [out(valueOf(r, p, b, 's')), out(valueOf(r, p, b, 'r'))])),
        out(s.blockAverages[1]),
        out(s.blockAverages[2]),
        out(s.blockAverages[3]),
        out(s.blockAverages[4]),
        out(cf),
        out(s.completiveFinal != null && cf != null ? cf * 0.5 : null),
        out(r.final.completiveScore),
        out(r.final.completiveScore != null ? r.final.completiveScore * 0.5 : null),
        out(s.completiveFinal),
        out(s.extraordinaryFinal != null && cf != null ? cf * 0.3 : null),
        out(r.final.extraordinaryScore),
        out(r.final.extraordinaryScore != null ? r.final.extraordinaryScore * 0.7 : null),
        out(s.extraordinaryFinal),
        out(r.final.specialScore),
        s.situation === 'A' ? 'X' : '',
        s.situation === 'R' ? 'X' : '',
      ]
    })
    const label = sectionLabel(data.section.grade.name, data.section.name)
    void exportExcel(
      [{ name: 'Matemáticas', title: `Registro de calificaciones — Matemáticas · ${label} · ${data.section.schoolYear} · ${SCALE_LABELS[scaleType]}`, header, rows: body, widths: [5, 18, 16] }],
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
          const { block, period, recovery } = templateColumn(i)
          next[`${row.student.id}-${period}-${block}-${recovery ? 'r' : 's'}`] = parseScaleInput(String(raw), scaleType)
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
          <label className="sr-only" htmlFor="recalc-block">Bloque a recalcular</label>
          <select
            id="recalc-block"
            aria-label="Bloque a recalcular"
            value={recalcBlock}
            onChange={(e) => setRecalcBlock(e.target.value)}
            className="h-9 rounded-lg border border-line bg-surface-2 px-2 text-xs text-ink"
          >
            <option value="">Todos los bloques</option>
            {data.blocks.map((b) => <option key={b.block} value={b.block}>{b.code}</option>)}
          </select>
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
          <Button size="sm" onClick={save} loading={saving} disabled={!dirty || dirtyLocked} icon={<Save className="h-3.5 w-3.5" />}>
            Guardar{dirty ? ` (${dirty})` : ''}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs text-ink-3">
        <Lock className="h-3.5 w-3.5" />
        <span className="font-semibold text-ink-2">Bloqueos</span>
        {[1, 2, 3, 4].map((p) => (
          <span key={p} className="flex items-center gap-1 rounded-full border border-line bg-surface px-1.5 py-0.5">
            P{p}
            <Badge tone={isLocked(p) ? 'red' : 'gray'}>{isLocked(p) ? 'Bloqueado' : 'Abierto'}</Badge>
            <IconButton
              label={isLocked(p) ? `Desbloquear periodo ${p}` : `Bloquear periodo ${p}`}
              className="h-11 w-11"
              onClick={() => void toggleLock(p, !isLocked(p))}
            >
              {isLocked(p) ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            </IconButton>
          </span>
        ))}
      </div>

      {block && <p className="text-xs text-ink-3">{data.blocks.find((b) => b.block === block)?.name} — P: calificación del periodo · RP: recuperación pedagógica (cuenta la mayor). Escala {SCALE_LABELS[scaleType]}.</p>}

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
                      {isLocked(p) && <Lock className="mx-auto mt-0.5 h-3 w-3 text-red-500" />}
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
                              text={scaleText(valueOf(r, p, block, kind), scaleType)}
                              onCommit={(text) => setEdits((ed) => ({ ...ed, [`${r.student.id}-${p}-${block}-${kind}`]: parseScaleInput(text, scaleType) }))}
                              disabled={isLocked(p)}
                              className={cn(kind === 'r' && 'bg-soft-blue', edits[`${r.student.id}-${p}-${block}-${kind}`] !== undefined && 'ring-2 ring-pink-300')}
                            />
                          </td>
                        )),
                      )}
                      <td className={cn('text-center font-bold', TONE_TEXT[scoreTone(s.blockAverages[block], data.section.passing)])}>
                        {scaleText(s.blockAverages[block], scaleType)}
                      </td>
                    </>
                  ) : (
                    <>
                      {[1, 2, 3, 4].map((b) => (
                        <td key={b} className={cn('text-center font-semibold', TONE_TEXT[scoreTone(s.blockAverages[b], data.section.passing)])}>
                          {scaleText(s.blockAverages[b], scaleType)}
                        </td>
                      ))}
                      <td className={cn('text-center font-extrabold', TONE_TEXT[scoreTone(s.finalScore, data.section.passing)])}>{scaleText(s.finalScore, scaleType)}</td>
                      {(['completiveScore', 'extraordinaryScore', 'specialScore'] as const).map((field, i) => (
                        <FinalCells
                          key={field}
                          value={r.final[field]}
                          scaleType={scaleType}
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
        Promedio de la sección: <b className="text-ink">{scaleText(data.stats.average, scaleType)}</b> · Aprobados: {data.stats.approved} · Pendientes: {data.stats.pending} · Reprobados: {data.stats.failed} · Nota mínima: {scaleText(data.section.passing, scaleType)}
      </div>

      <section className="overflow-hidden rounded-2xl border border-line" aria-label="Historial de calificaciones">
        <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
          <h3 className="text-sm font-semibold text-ink">Historial de calificaciones</h3>
          <Button variant="ghost" size="sm" onClick={loadHistory}>Actualizar</Button>
        </div>
        <div className="max-h-56 overflow-auto">
          <table className="table min-w-[40rem]">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estudiante</th>
                <th>Acción</th>
                <th>Cambio</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-ink-3">Sin cambios registrados</td></tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="align-top text-xs">
                    <td className="whitespace-nowrap text-ink-3">{formatDateTime(item.createdAt)}</td>
                    <td className="whitespace-nowrap">
                      {item.student ? `${item.student.lastName}, ${item.student.firstName}` : <span className="text-ink-3">Sección</span>}
                    </td>
                    <td className={cn('font-semibold', ACTION_CLASSES[item.action] ?? 'text-ink-2')}>
                      {ACTION_LABELS[item.action] ?? item.action}
                      {item.period ? ` · P${item.period}` : ''}
                    </td>
                    <td>
                      <span className="text-ink-3">{formatSnapshot(item.previousValue, scaleType)}</span>
                      {' → '}
                      <span className="font-semibold text-ink">{formatSnapshot(item.nextValue, scaleType)}</span>
                    </td>
                    <td className="text-ink-3">{item.reason ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function FinalCells({
  value,
  enabled,
  computed,
  showComputed,
  scaleType,
  onChange,
}: {
  value: number | null
  enabled: boolean
  computed: number | null
  showComputed: boolean
  scaleType: GradingScaleType
  onChange: (v: number | null) => void
}) {
  return (
    <>
      <td className="px-1 text-center">
        {enabled || value != null ? (
          <ScoreInput
            text={scaleText(value, scaleType)}
            onCommit={(text) => onChange(parseScaleInput(text, scaleType))}
          />
        ) : (
          <span className="text-ink-3">—</span>
        )}
      </td>
      {showComputed && <td className="text-center font-semibold text-ink-2">{scaleText(computed, scaleType)}</td>}
    </>
  )
}
