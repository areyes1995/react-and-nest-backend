// ──────────────────────────────────────────────
// PayoutsPage — Administrador de retiros.
// Cada payout se reparte antes de gastarse, para que
// no desaparezca sin dejar nada.
// Ruta: /app/trading/payouts
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { Coins, Trash2 } from 'lucide-react'
import { EmptyState, SkeletonChartCard } from '@components/ui'
import {
  createPayout,
  deletePayout,
  getDistributionPlans,
  listFundingAccounts,
  listPayouts,
  saveDistributionPlan,
} from '@services/trading'
import { allocate, type Bucket } from '@features/trading/calc'
import BucketEditor from '@features/trading/BucketEditor'
import {
  ErrorNote,
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

export default function PayoutsPage() {
  const { data, loading, error, reload } = useLoader(listPayouts)
  const { data: plans, reload: reloadPlans } = useLoader(getDistributionPlans)
  const { data: accounts } = useLoader(listFundingAccounts)
  const [amount, setAmount] = useState(2000)
  const [accountId, setAccountId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [draft, setDraft] = useState<Bucket[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const buckets = draft ?? plans?.PAYOUT ?? []
  const preview = useMemo(() => allocate(amount, buckets), [amount, buckets])

  const register = async () => {
    if (amount <= 0) return setFormError('El monto debe ser mayor que 0.')
    setSaving(true)
    setFormError(null)
    try {
      await createPayout({
        amount,
        fundingAccountId: accountId ? Number(accountId) : null,
        receivedAt: new Date(`${date}T12:00:00`).toISOString(),
        note: note.trim() || null,
        buckets,
      })
      setNote('')
      await reload()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell title="Administrador de retiros" subtitle="Distribuye cada payout antes de gastarlo">
      <ErrorNote message={error} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="💵 Payout recibido" icon={<Coins className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Monto" value={amount} onChange={setAmount} suffix="USD" min={0} />
            <TextField label="Fecha" type="date" value={date} onChange={setDate} />
            <SelectField
              label="Cuenta de fondeo"
              value={accountId}
              onChange={setAccountId}
              options={[{ value: '', label: '— Ninguna —' }, ...(accounts ?? []).map(a => ({ value: String(a.id), label: `${a.firmName} · ${money(a.accountSize)}` }))]}
            />
            <TextField label="Nota" value={note} onChange={setNote} />
          </div>

          <p className="text-sm font-medium text-[var(--text-primary)] mt-5 mb-2">¿Cómo quieres distribuirlo?</p>
          <ul className="space-y-1.5">
            {preview.map(b => (
              <li key={b.key || b.label} className="flex items-center gap-2 text-sm">
                <span className="w-24 text-right tabular-nums font-semibold text-[var(--text-primary)]">{money(b.amount)}</span>
                <span className="text-[var(--text-secondary)]">
                  → {b.label} <span className="text-[var(--text-muted)]">({b.percent}%)</span>
                </span>
              </li>
            ))}
          </ul>
          <ErrorNote message={formError} />
          <button onClick={() => void register()} disabled={saving || !buckets.length} className={`${primaryButton} mt-4`}>
            {saving ? 'Registrando…' : 'Registrar payout con esta distribución'}
          </button>

          <p className="text-caption uppercase tracking-wide text-[var(--text-muted)] mt-6 mb-2">Porcentajes por defecto</p>
          {plans && (
            <BucketEditor
              buckets={plans.PAYOUT}
              onChange={setDraft}
              onSave={async next => {
                await saveDistributionPlan('PAYOUT', next)
                setDraft(null)
                await reloadPlans()
              }}
            />
          )}
        </Panel>

        <div className="space-y-5">
          <Panel title="Acumulado">
            {data ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <StatTile label="Total recibido" value={money(data.total)} valueClass="text-emerald-400" hint={`${data.items.length} payouts`} />
                {data.byBucket.map(b => (
                  <StatTile key={b.key} label={b.label} value={money(b.amount)} />
                ))}
              </div>
            ) : (
              <SkeletonChartCard height={120} />
            )}
          </Panel>

          <Panel title="Historial">
            {loading && !data ? (
              <SkeletonChartCard height={200} />
            ) : !data || data.items.length === 0 ? (
              <EmptyState message="Aún no registras payouts." />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {data.items.map(p => (
                  <li key={p.id} className="py-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[var(--text-primary)]">
                        {money(p.amount)} · {new Date(p.receivedAt).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                        {p.fundingAccount && <span className="text-[var(--text-muted)] font-normal"> · {p.fundingAccount.firmName}</span>}
                      </span>
                      <button onClick={() => void deletePayout(p.id).then(reload)} className="p-1 text-[var(--text-muted)] hover:text-red-400" title="Eliminar payout">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[var(--text-muted)] mt-1">{p.allocation.map(a => `${a.label} ${money(a.amount)}`).join(' · ')}</p>
                    {p.note && <p className="text-[var(--text-secondary)] mt-0.5">{p.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </PageShell>
  )
}
