// ──────────────────────────────────────────────
// BucketEditor — categorías configurables (nombre + %)
// para distribuir ingresos o payouts. Los % deben sumar 100.
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Plus, Save, X } from 'lucide-react'
import { formInputClass } from '@components/ui'
import { bucketsTotal, type Bucket } from './calc'
import { primaryButton, secondaryButton } from './ui'

function slug(label: string, taken: Set<string>): string {
  const base =
    label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32) || 'categoria'
  let key = base
  for (let n = 2; taken.has(key); n++) key = `${base}-${n}`
  return key
}

export default function BucketEditor({
  buckets,
  onSave,
  onChange,
}: {
  buckets: Bucket[]
  onSave: (buckets: Bucket[]) => Promise<void>
  /** Vista previa en vivo mientras se edita. */
  onChange?: (buckets: Bucket[]) => void
}) {
  const [rows, setRows] = useState(buckets)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => setRows(buckets), [buckets])

  const update = (next: Bucket[]) => {
    setRows(next)
    setSaved(false)
    onChange?.(next)
  }

  const total = bucketsTotal(rows)
  const valid = Math.abs(total - 100) < 0.01 && rows.length > 0 && rows.every(r => r.label.trim())

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const taken = new Set<string>()
      const normalized = rows.map(r => {
        const key = r.key && !taken.has(r.key) ? r.key : slug(r.label, taken)
        taken.add(key)
        return { ...r, key, label: r.label.trim() }
      })
      await onSave(normalized)
      setSaved(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            aria-label="Categoría"
            value={row.label}
            onChange={e => update(rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))}
            className={`${formInputClass} flex-1`}
          />
          <div className="relative w-24 shrink-0">
            <input
              aria-label={`Porcentaje de ${row.label}`}
              type="number"
              step="any"
              min={0}
              max={100}
              value={Number.isFinite(row.percent) ? row.percent : ''}
              onChange={e => update(rows.map((r, j) => (j === i ? { ...r, percent: e.target.value === '' ? 0 : Number(e.target.value) } : r)))}
              className={`${formInputClass} pr-7 tabular-nums`}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">%</span>
          </div>
          <button
            onClick={() => update(rows.filter((_, j) => j !== i))}
            disabled={rows.length <= 1}
            className="p-1.5 text-[var(--text-muted)] hover:text-red-400 disabled:opacity-30"
            title="Quitar categoría"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
        <button
          onClick={() => update([...rows, { key: '', label: 'Nueva categoría', percent: Math.max(0, round(100 - total)) }])}
          disabled={rows.length >= 12}
          className={secondaryButton}
        >
          <Plus className="w-3.5 h-3.5" /> Categoría
        </button>
        <span className={`text-xs tabular-nums ${valid ? 'text-emerald-400' : 'text-orange-400'}`}>
          Total: {total}% {valid ? '✔' : '(debe ser 100%)'}
        </span>
        <button onClick={() => void save()} disabled={!valid || saving} className={primaryButton}>
          <Save className="w-3.5 h-3.5" /> {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function round(v: number) {
  return Math.round(v * 100) / 100
}
