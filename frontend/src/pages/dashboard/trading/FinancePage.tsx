// ──────────────────────────────────────────────
// FinancePage — Administración de ingresos.
// Ingresos del mes por fuente y distribución automática
// en categorías configurables.
// Ruta: /app/trading/finance
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { PieChart, Plus, Trash2, Wallet } from 'lucide-react'
import { SkeletonChartCard } from '@components/ui'
import {
  deleteIncome,
  getFinanceSummary,
  saveDistributionPlan,
  saveIncome,
  getDistributionPlans,
  type IncomeSource,
} from '@services/trading'
import { allocate, type Bucket } from '@features/trading/calc'
import BucketEditor from '@features/trading/BucketEditor'
import {
  ErrorNote,
  INCOME_SOURCE_LABELS,
  NumberField,
  PageShell,
  Panel,
  SelectField,
  StatTile,
  TextField,
  money,
  primaryButton,
  useLoader,
} from '@features/trading/ui'

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function FinancePage() {
  const [month, setMonth] = useState(currentMonth())
  const { data, loading, error, reload } = useLoader(() => getFinanceSummary(month), [month])
  const { data: plans, reload: reloadPlans } = useLoader(getDistributionPlans)
  const [preview, setPreview] = useState<Bucket[] | null>(null)
  const [source, setSource] = useState<IncomeSource>('TRADING')
  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')
  const [adding, setAdding] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const distribution = useMemo(
    () => (data ? (preview ? allocate(data.total, preview) : data.distribution) : []),
    [data, preview],
  )

  const add = async () => {
    if (amount <= 0) return setFormError('El monto debe ser mayor que 0.')
    setAdding(true)
    setFormError(null)
    try {
      await saveIncome({ source, amount, month, note: note.trim() || null })
      setAmount(0)
      setNote('')
      await reload()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <PageShell title="Administración de ingresos" subtitle="No importa solo cuánto ganas: importa cuánto conservas">
      <div className="max-w-[12rem]">
        <TextField label="Mes" type="month" value={month} onChange={v => v && setMonth(v)} />
      </div>
      <ErrorNote message={error} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Ingresos del mes" icon={<Wallet className="w-4 h-4" />}>
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <SelectField<IncomeSource>
              label="Fuente"
              value={source}
              onChange={setSource}
              options={Object.entries(INCOME_SOURCE_LABELS).map(([value, label]) => ({ value: value as IncomeSource, label }))}
            />
            <NumberField label="Monto" value={amount} onChange={setAmount} suffix="USD" min={0} />
            <button onClick={() => void add()} disabled={adding} className={`${primaryButton} col-span-2 sm:col-span-1 justify-center h-10`}>
              <Plus className="w-3.5 h-3.5" /> Añadir
            </button>
            <div className="col-span-2 sm:col-span-3">
              <TextField label="Nota (opcional)" value={note} onChange={setNote} />
            </div>
          </div>
          <ErrorNote message={formError} />

          {loading && !data ? (
            <SkeletonChartCard height={160} />
          ) : data ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                {data.bySource
                  .filter(s => s.amount > 0)
                  .map(s => (
                    <StatTile key={s.source} label={INCOME_SOURCE_LABELS[s.source]} value={money(s.amount)} />
                  ))}
                <StatTile label="Total" value={money(data.total)} valueClass="text-emerald-400" />
              </div>
              {data.incomes.length > 0 && (
                <ul className="mt-4 divide-y divide-[var(--border)]">
                  {data.incomes.map(i => (
                    <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                      <span className="text-[var(--text-secondary)] truncate">
                        {INCOME_SOURCE_LABELS[i.source]}
                        {i.note && <span className="text-[var(--text-muted)]"> · {i.note}</span>}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums text-[var(--text-primary)]">{money(i.amount)}</span>
                        <button
                          onClick={() => void deleteIncome(i.id).then(reload)}
                          className="p-1 text-[var(--text-muted)] hover:text-red-400"
                          title="Eliminar ingreso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : null}
        </Panel>

        <Panel title="💰 Distribución mensual" icon={<PieChart className="w-4 h-4" />}>
          <p className="text-xs text-[var(--text-muted)] mb-3">Ingresos: {money(data?.total ?? 0)}</p>
          <table className="w-full text-xs">
            <thead className="text-[var(--text-muted)]">
              <tr className="text-left">
                <th className="py-1.5 font-medium">Categoría</th>
                <th className="py-1.5 font-medium text-right">%</th>
                <th className="py-1.5 font-medium text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {distribution.map(b => (
                <tr key={b.key || b.label}>
                  <td className="py-2 text-[var(--text-primary)]">{b.label}</td>
                  <td className="py-2 text-right tabular-nums text-[var(--text-secondary)]">{b.percent}%</td>
                  <td className="py-2 text-right tabular-nums font-medium text-[var(--text-primary)]">{money(b.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-caption uppercase tracking-wide text-[var(--text-muted)] mt-5 mb-2">Configurar porcentajes</p>
          {plans && (
            <BucketEditor
              buckets={plans.INCOME}
              onChange={setPreview}
              onSave={async buckets => {
                await saveDistributionPlan('INCOME', buckets)
                setPreview(null)
                await Promise.all([reload(), reloadPlans()])
              }}
            />
          )}
        </Panel>
      </div>

      {data && data.history.length > 1 && (
        <Panel title="Últimos meses">
          <div className="flex items-end gap-2 h-32">
            {data.history.map(h => {
              const max = Math.max(...data.history.map(x => x.total), 1)
              return (
                <div key={h.month} className="flex-1 h-full flex flex-col justify-end items-center gap-1 min-w-0" title={`${h.month}: ${money(h.total)}`}>
                  <div className="flex-1 w-full flex items-end justify-center">
                    <div className="w-full max-w-[28px] rounded-t bg-emerald-500/70" style={{ height: `${(h.total / max) * 100}%` }} />
                  </div>
                  <span className="text-nano text-[var(--text-muted)]">{h.month.slice(2)}</span>
                </div>
              )
            })}
          </div>
        </Panel>
      )}
    </PageShell>
  )
}
