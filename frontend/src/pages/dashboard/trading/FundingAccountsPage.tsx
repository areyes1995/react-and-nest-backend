// ──────────────────────────────────────────────
// FundingAccountsPage — Panel de empresas de fondeo.
// Cada challenge con su semáforo y su propio
// administrador de riesgo.
// Ruta: /app/trading/funding
// ──────────────────────────────────────────────

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { ConfirmDeleteModal, EmptyState, FormModal, SkeletonChartCard, formInputClass } from '@components/ui'
import {
  deleteFundingAccount,
  listFundingAccounts,
  saveFundingAccount,
  type DrawdownType,
  type FundingAccount,
  type FundingAccountInput,
  type FundingPhase,
  type FundingStatus,
} from '@services/trading'
import {
  ErrorNote,
  FUNDING_PHASE_LABELS,
  FUNDING_STATUS_LABELS,
  HEALTH_META,
  NumberField,
  PageShell,
  ProgressBar,
  SelectField,
  StatTile,
  TextField,
  money,
  pnlClass,
  primaryButton,
  secondaryButton,
  signedMoney,
  useLoader,
} from '@features/trading/ui'

const EMPTY: FundingAccountInput = {
  firmName: '',
  label: '',
  accountSize: 100_000,
  phase: 'CHALLENGE',
  status: 'ACTIVE',
  profitTargetPct: 8,
  dailyLossPct: 5,
  maxDrawdownPct: 10,
  drawdownType: 'STATIC',
  minTradingDays: 4,
  targetDays: 10,
  riskPerTradePct: 0.5,
  rewardRatio: 2,
  startDate: new Date().toISOString().slice(0, 10),
  notes: '',
}

export default function FundingAccountsPage() {
  const { data, loading, error, reload } = useLoader(listFundingAccounts)
  const [editing, setEditing] = useState<{ id?: number; form: FundingAccountInput } | null>(null)
  const [deleting, setDeleting] = useState<FundingAccount | null>(null)

  return (
    <PageShell
      title="Mis challenges"
      subtitle="Panel de empresas de fondeo"
      actions={
        <button className={primaryButton} onClick={() => setEditing({ form: { ...EMPTY } })}>
          <Plus className="w-3.5 h-3.5" /> Nueva cuenta
        </button>
      }
    >
      <ErrorNote message={error} />
      {loading && !data ? (
        <SkeletonChartCard height={260} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="Registra tu primer challenge para que cada cuenta tenga su propio administrador de riesgo." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {data.map(a => (
            <AccountCard
              key={a.id}
              account={a}
              onEdit={() => {
                const { id: _id, summary: _s, ...form } = a
                setEditing({ id: a.id, form: { ...form, startDate: a.startDate.slice(0, 10) } })
              }}
              onDelete={() => setDeleting(a)}
            />
          ))}
        </div>
      )}

      {editing && (
        <AccountFormModal
          id={editing.id}
          initial={editing.form}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void reload()
          }}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deleting}
        title="Eliminar cuenta de fondeo"
        itemName={deleting ? `${deleting.firmName} · ${money(deleting.accountSize)}` : undefined}
        description="Sus operaciones del diario se conservan pero dejarán de contar para esta cuenta."
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          void deleteFundingAccount(deleting.id).then(() => {
            setDeleting(null)
            void reload()
          })
        }}
      />
    </PageShell>
  )
}

function AccountCard({ account: a, onEdit, onDelete }: { account: FundingAccount; onEdit: () => void; onDelete: () => void }) {
  const s = a.summary
  const health = HEALTH_META[s.health]
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 lg:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {health.emoji} {a.firmName} {a.label && <span className="text-[var(--text-muted)] font-normal">· {a.label}</span>}
          </h3>
          <p className="text-caption text-[var(--text-muted)]">
            {money(a.accountSize)} · {FUNDING_PHASE_LABELS[a.phase]} · {FUNDING_STATUS_LABELS[a.status]} · DD {a.drawdownType === 'TRAILING' ? 'trailing' : 'estático'}
          </p>
          <p className={`text-xs mt-1 ${health.className}`}>{s.message}</p>
        </div>
        <div className="flex shrink-0">
          <button onClick={onEdit} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="Editar">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-[var(--text-muted)] hover:text-red-400" title="Eliminar">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-caption text-[var(--text-muted)] mb-1">
          <span>
            Objetivo {a.profitTargetPct}%: <span className={pnlClass(s.profit)}>{signedMoney(s.profit)}</span> de {money(s.profitTarget)}
          </span>
          <span>{Math.round(s.progressPct * 100)}%</span>
        </div>
        <ProgressBar value={s.progressPct} barClass={health.bar} />
        <div className="flex justify-between text-caption text-[var(--text-muted)] mt-3 mb-1">
          <span>
            Drawdown usado ({a.maxDrawdownPct}%): piso en {money(s.drawdown.floor)}
          </span>
          <span>{Math.round(s.drawdown.usedPct * 100)}%</span>
        </div>
        <ProgressBar value={s.drawdown.usedPct} barClass="bg-red-500" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatTile label="Balance" value={money(s.balance)} />
        <StatTile label="Riesgo por trade" value={money(s.riskPerTrade)} hint={`${a.riskPerTradePct}% · 1:${a.rewardRatio}`} />
        <StatTile label="Pérdida hoy" value={money(s.daily.used)} hint={`de ${money(s.daily.limit)} · ${s.lossesToDailyLimit} stops hasta el límite`} />
        <StatTile label="Margen al DD" value={money(s.drawdown.distance)} hint={`${s.lossesToMaxDrawdown} stops`} />
        <StatTile
          label="Ritmo necesario"
          value={s.targetReached ? '✔' : `${money(s.requiredPerDay)}/día`}
          hint={s.targetReached ? 'Objetivo cumplido' : `≈ ${s.requiredRPerDay}R/día · ${s.daysRemaining} días`}
        />
        <StatTile
          label="Días operados"
          value={`${s.tradingDays} / ${a.minTradingDays}`}
          hint={s.minTradingDaysMet ? 'Mínimo cumplido' : 'Mínimo pendiente'}
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link to={`/app/trading/challenge?account=${a.id}`} className={secondaryButton}>
          <Target className="w-3.5 h-3.5" /> Plan del challenge
        </Link>
        <Link to={`/app/trading/stats?account=${a.id}`} className={secondaryButton}>
          Estadísticas
        </Link>
      </div>
    </section>
  )
}

function AccountFormModal({
  id,
  initial,
  onClose,
  onSaved,
}: {
  id?: number
  initial: FundingAccountInput
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof FundingAccountInput>(key: K, value: FundingAccountInput[K]) => setForm(f => ({ ...f, [key]: value }))

  const submit = async () => {
    if (!form.firmName.trim()) return setError('Indica la empresa de fondeo.')
    setSaving(true)
    setError(null)
    try {
      await saveFundingAccount(
        {
          ...form,
          firmName: form.firmName.trim(),
          label: form.label?.trim() || null,
          notes: form.notes?.trim() || null,
          startDate: new Date(`${form.startDate}T12:00:00`).toISOString(),
        },
        id,
      )
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormModal isOpen onClose={onClose} title={id ? 'Editar cuenta' : 'Nueva cuenta de fondeo'} subtitle="Copia las reglas exactas de tu challenge." onSubmit={() => void submit()} saving={saving} error={error} maxWidth="max-w-2xl">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <TextField label="Empresa" value={form.firmName} onChange={v => set('firmName', v)} placeholder="FTMO, FundedNext…" />
        <TextField label="Etiqueta (opcional)" value={form.label ?? ''} onChange={v => set('label', v)} placeholder="Fase 1 · agosto" />
        <NumberField label="Tamaño de la cuenta" value={form.accountSize} onChange={v => set('accountSize', v)} suffix="USD" min={1} />
        <SelectField<FundingPhase>
          label="Fase"
          value={form.phase}
          onChange={v => set('phase', v)}
          options={Object.entries(FUNDING_PHASE_LABELS).map(([value, label]) => ({ value: value as FundingPhase, label }))}
        />
        <SelectField<FundingStatus>
          label="Estado"
          value={form.status}
          onChange={v => set('status', v)}
          options={Object.entries(FUNDING_STATUS_LABELS).map(([value, label]) => ({ value: value as FundingStatus, label }))}
        />
        <TextField label="Fecha de inicio" type="date" value={form.startDate} onChange={v => set('startDate', v)} />
        <NumberField label="Profit target" value={form.profitTargetPct} onChange={v => set('profitTargetPct', v)} suffix="%" />
        <NumberField label="Daily loss limit" value={form.dailyLossPct} onChange={v => set('dailyLossPct', v)} suffix="%" />
        <NumberField label="Maximum drawdown" value={form.maxDrawdownPct} onChange={v => set('maxDrawdownPct', v)} suffix="%" />
        <SelectField<DrawdownType>
          label="Tipo de drawdown"
          value={form.drawdownType}
          onChange={v => set('drawdownType', v)}
          options={[
            { value: 'STATIC', label: 'Estático (sobre el inicial)' },
            { value: 'TRAILING', label: 'Trailing (sigue al pico)' },
          ]}
        />
        <NumberField label="Días mínimos" value={form.minTradingDays} onChange={v => set('minTradingDays', v)} step={1} min={0} />
        <NumberField label="Días deseados" value={form.targetDays} onChange={v => set('targetDays', v)} step={1} min={1} />
        <NumberField label="Riesgo por operación" value={form.riskPerTradePct} onChange={v => set('riskPerTradePct', v)} suffix="%" step={0.05} />
        <NumberField label="R:R promedio (1:x)" value={form.rewardRatio} onChange={v => set('rewardRatio', v)} step={0.1} />
        <div className="col-span-2 md:col-span-3 form-field">
          <label htmlFor="acc-notes">Notas</label>
          <textarea id="acc-notes" rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} className={formInputClass} />
        </div>
      </div>
    </FormModal>
  )
}
