// ──────────────────────────────────────────────
// JournalPage — Diario del trader.
// Cada operación guarda ejecución, resultado en $ y R,
// y la parte psicológica: ¿seguiste tu plan?
// Ruta: /app/trading/journal
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { ConfirmDeleteModal, EmptyState, FormModal, SkeletonChartCard, formInputClass } from '@components/ui'
import {
  deleteTrade,
  getRiskStatus,
  listFundingAccounts,
  listTrades,
  saveTrade,
  type AccountScope,
  type FundingAccount,
  type Trade,
  type TradeDirection,
  type TradeEmotion,
  type TradeInput,
  type TradingSession,
} from '@services/trading'
import { ASSET_PRESETS } from '@features/trading/calc'
import {
  ALERT_META,
  CheckField,
  EMOTION_LABELS,
  ErrorNote,
  OptionalNumberField,
  PageShell,
  SESSION_LABELS,
  SelectField,
  TextField,
  money,
  pnlClass,
  primaryButton,
  rMultiple,
  secondaryButton,
  signedMoney,
  useLoader,
} from '@features/trading/ui'

type FormState = Omit<TradeInput, 'tradeDate' | 'resultAmount'> & { tradeDate: string; resultAmount: number | null }

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function emptyForm(accountId: number | null): FormState {
  return {
    fundingAccountId: accountId,
    asset: 'XAUUSD',
    direction: 'LONG',
    tradeDate: toLocalInput(new Date().toISOString()),
    session: null,
    setup: '',
    entryPrice: null,
    stopLoss: null,
    takeProfit: null,
    positionSize: null,
    riskPct: null,
    riskAmount: null,
    resultAmount: null,
    resultR: null,
    screenshotUrl: '',
    followedPlan: true,
    impulsive: false,
    movedStopLoss: false,
    closedEarly: false,
    emotion: null,
    comment: '',
  }
}

function fromTrade(t: Trade): FormState {
  const { id: _id, fundingAccount: _fa, ...rest } = t
  return { ...rest, tradeDate: toLocalInput(t.tradeDate), setup: t.setup ?? '', screenshotUrl: t.screenshotUrl ?? '', comment: t.comment ?? '' }
}

export default function JournalPage() {
  const [scope, setScope] = useState<AccountScope>('all')
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useLoader(() => listTrades({ account: scope, page, pageSize: 20 }), [scope, page])
  const { data: accounts } = useLoader(listFundingAccounts)
  const { data: risk, reload: reloadRisk } = useLoader(getRiskStatus)
  const [editing, setEditing] = useState<{ id?: number; form: FormState } | null>(null)
  const [deleting, setDeleting] = useState<Trade | null>(null)

  const scopeOptions = useMemo(
    () => [
      { value: 'all' as AccountScope, label: 'Todas las cuentas' },
      { value: 'personal' as AccountScope, label: 'Cuenta personal' },
      ...(accounts ?? []).map(a => ({ value: String(a.id) as AccountScope, label: `${a.firmName} · ${money(a.accountSize)}` })),
    ],
    [accounts],
  )

  const refresh = () => {
    void reload()
    void reloadRisk()
  }

  return (
    <PageShell
      title="Diario del trader"
      subtitle={data ? `${data.totalItems} operaciones` : undefined}
      actions={
        <button
          className={primaryButton}
          onClick={() => setEditing({ form: emptyForm(scope !== 'all' && scope !== 'personal' ? Number(scope) : null) })}
        >
          <Plus className="w-3.5 h-3.5" /> Nueva operación
        </button>
      }
    >
      {risk && risk.level !== 'NORMAL' && (
        <div className={`rounded-lg border px-4 py-3 text-xs ${ALERT_META[risk.level].className}`}>
          <p className="font-semibold">
            {ALERT_META[risk.level].emoji} {risk.headline}
          </p>
          {risk.alerts.map(a => (
            <p key={a.code} className="text-[var(--text-secondary)] mt-0.5">
              {a.message}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <select
          aria-label="Cuenta"
          value={scope}
          onChange={e => {
            setScope(e.target.value as AccountScope)
            setPage(1)
          }}
          className={`${formInputClass} max-w-xs`}
        >
          {scopeOptions.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Link to={`/app/trading/stats?account=${scope}`} className={secondaryButton}>
          Ver estadísticas
        </Link>
      </div>

      <ErrorNote message={error} />

      {loading && !data ? (
        <SkeletonChartCard height={320} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="Aún no hay operaciones registradas. Cada operación que anotes alimenta tus estadísticas y alertas." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-xs min-w-[860px]">
            <thead className="bg-[var(--bg-surface-soft)] text-[var(--text-muted)]">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Activo</th>
                <th className="px-3 py-2 font-medium">Cuenta</th>
                <th className="px-3 py-2 font-medium">Sesión / Setup</th>
                <th className="px-3 py-2 font-medium text-right">Riesgo</th>
                <th className="px-3 py-2 font-medium text-right">Resultado</th>
                <th className="px-3 py-2 font-medium text-right">R</th>
                <th className="px-3 py-2 font-medium">Disciplina</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.items.map(t => (
                <tr key={t.id} className="hover:bg-[var(--hover-overlay)]">
                  <td className="px-3 py-2 whitespace-nowrap text-[var(--text-secondary)]">{new Date(t.tradeDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={t.direction === 'LONG' ? 'text-emerald-400' : 'text-red-400'}>{t.direction === 'LONG' ? '▲ Long' : '▼ Short'}</span>{' '}
                    <span className="font-medium text-[var(--text-primary)]">{t.asset}</span>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{t.fundingAccount?.firmName ?? 'Personal'}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">
                    {[t.session && SESSION_LABELS[t.session], t.setup].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-[var(--text-secondary)]">
                    {t.riskAmount != null ? money(t.riskAmount) : '—'}
                    {t.riskPct != null && <span className="text-[var(--text-muted)]"> ({Number(t.riskPct.toFixed(2))}%)</span>}
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums ${pnlClass(t.resultAmount)}`}>{signedMoney(t.resultAmount)}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${pnlClass(t.resultR)}`}>{rMultiple(t.resultR)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {!t.followedPlan && <Tag tone="red">Fuera de plan</Tag>}
                      {t.impulsive && <Tag tone="orange">Impulso</Tag>}
                      {t.movedStopLoss && <Tag tone="orange">Movió SL</Tag>}
                      {t.closedEarly && <Tag tone="yellow">Cerró antes</Tag>}
                      {t.emotion && <Tag>{EMOTION_LABELS[t.emotion]}</Tag>}
                      {t.followedPlan && !t.impulsive && !t.movedStopLoss && !t.closedEarly && <Tag tone="green">Según plan</Tag>}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    {t.screenshotUrl && (
                      <a href={t.screenshotUrl} target="_blank" rel="noreferrer" className="inline-block p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="Ver captura">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button onClick={() => setEditing({ id: t.id, form: fromTrade(t) })} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleting(t)} className="p-1 text-[var(--text-muted)] hover:text-red-400" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className={secondaryButton}>
            Anterior
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            {page} / {data.totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages} className={secondaryButton}>
            Siguiente
          </button>
        </div>
      )}

      {editing && (
        <TradeFormModal
          initial={editing.form}
          id={editing.id}
          accounts={accounts ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            refresh()
          }}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          void deleteTrade(deleting.id).then(() => {
            setDeleting(null)
            refresh()
          })
        }}
        title="Eliminar operación"
        itemName={deleting ? `${deleting.asset} · ${new Date(deleting.tradeDate).toLocaleDateString()}` : undefined}
      />
    </PageShell>
  )
}

const TAG_TONES = {
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  neutral: 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)]',
}

function Tag({ tone = 'neutral', children }: { tone?: keyof typeof TAG_TONES; children: React.ReactNode }) {
  return <span className={`text-mini px-1.5 py-0.5 rounded-full border whitespace-nowrap ${TAG_TONES[tone]}`}>{children}</span>
}

function TradeFormModal({
  initial,
  id,
  accounts,
  onClose,
  onSaved,
}: {
  initial: FormState
  id?: number
  accounts: FundingAccount[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))

  const plannedRR =
    form.entryPrice != null && form.stopLoss != null && form.takeProfit != null && form.entryPrice !== form.stopLoss
      ? Math.abs(form.takeProfit - form.entryPrice) / Math.abs(form.entryPrice - form.stopLoss)
      : null

  const submit = async () => {
    if (!form.asset.trim()) return setError('Indica el activo.')
    if (form.resultAmount == null) return setError('Indica el resultado en dinero (negativo si fue pérdida).')
    setSaving(true)
    setError(null)
    try {
      await saveTrade(
        {
          ...form,
          resultAmount: form.resultAmount,
          tradeDate: new Date(form.tradeDate).toISOString(),
          setup: form.setup?.trim() || null,
          screenshotUrl: form.screenshotUrl?.trim() || null,
          comment: form.comment?.trim() || null,
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
    <FormModal
      isOpen
      onClose={onClose}
      title={id ? 'Editar operación' : 'Nueva operación'}
      subtitle="El R se calcula solo a partir del riesgo si no lo indicas."
      onSubmit={() => void submit()}
      saving={saving}
      error={error}
      maxWidth="max-w-3xl"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2">
          <SelectField
            label="Cuenta"
            value={form.fundingAccountId == null ? 'personal' : String(form.fundingAccountId)}
            onChange={v => set('fundingAccountId', v === 'personal' ? null : Number(v))}
            options={[
              { value: 'personal', label: 'Cuenta personal' },
              ...accounts.map(a => ({ value: String(a.id), label: `${a.firmName} · ${money(a.accountSize)}` })),
            ]}
          />
        </div>
        <div className="form-field">
          <label htmlFor="trade-asset">Activo</label>
          <input
            id="trade-asset"
            list="trade-assets"
            value={form.asset}
            onChange={e => set('asset', e.target.value)}
            className={formInputClass}
          />
          <datalist id="trade-assets">
            {ASSET_PRESETS.filter(a => a.id !== 'CUSTOM').map(a => (
              <option key={a.id} value={a.id} />
            ))}
          </datalist>
        </div>
        <SelectField<TradeDirection>
          label="Dirección"
          value={form.direction}
          onChange={v => set('direction', v)}
          options={[
            { value: 'LONG', label: 'Long ▲' },
            { value: 'SHORT', label: 'Short ▼' },
          ]}
        />
        <div className="col-span-2">
          <TextField label="Fecha y hora" type="datetime-local" value={form.tradeDate} onChange={v => set('tradeDate', v)} />
        </div>
        <SelectField<TradingSession | ''>
          label="Sesión"
          value={form.session ?? ''}
          onChange={v => set('session', v || null)}
          options={[{ value: '', label: '—' }, ...Object.entries(SESSION_LABELS).map(([value, label]) => ({ value: value as TradingSession, label }))]}
        />
        <TextField label="Setup utilizado" value={form.setup ?? ''} onChange={v => set('setup', v)} placeholder="Breakout, OB, FVG…" />

        <OptionalNumberField label="Entrada" value={form.entryPrice} onChange={v => set('entryPrice', v)} />
        <OptionalNumberField label="Stop loss" value={form.stopLoss} onChange={v => set('stopLoss', v)} />
        <OptionalNumberField label="Take profit" value={form.takeProfit} onChange={v => set('takeProfit', v)} hint={plannedRR ? `R:R planificado 1:${plannedRR.toFixed(2)}` : undefined} />
        <OptionalNumberField label="Lotes" value={form.positionSize} onChange={v => set('positionSize', v)} />

        <OptionalNumberField label="Riesgo %" value={form.riskPct} onChange={v => set('riskPct', v)} suffix="%" />
        <OptionalNumberField label="Riesgo $" value={form.riskAmount} onChange={v => set('riskAmount', v)} suffix="USD" />
        <OptionalNumberField label="Resultado $" value={form.resultAmount} onChange={v => set('resultAmount', v)} suffix="USD" hint="Negativo si fue pérdida" />
        <OptionalNumberField label="Resultado R" value={form.resultR} onChange={v => set('resultR', v)} suffix="R" hint="Opcional" />

        <div className="col-span-2 md:col-span-4">
          <TextField label="Captura del trade (URL)" type="url" value={form.screenshotUrl ?? ''} onChange={v => set('screenshotUrl', v)} placeholder="https://www.tradingview.com/x/…" />
        </div>

        <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-2 rounded-lg border border-[var(--border)] p-3">
          <CheckField label="¿Seguiste tu estrategia?" checked={form.followedPlan} onChange={v => set('followedPlan', v)} />
          <CheckField label="¿Entraste por impulso?" checked={form.impulsive} onChange={v => set('impulsive', v)} />
          <CheckField label="¿Moviste el SL?" checked={form.movedStopLoss} onChange={v => set('movedStopLoss', v)} />
          <CheckField label="¿Cerraste antes?" checked={form.closedEarly} onChange={v => set('closedEarly', v)} />
        </div>

        <SelectField<TradeEmotion | ''>
          label="Emoción"
          value={form.emotion ?? ''}
          onChange={v => set('emotion', v || null)}
          options={[{ value: '', label: '—' }, ...Object.entries(EMOTION_LABELS).map(([value, label]) => ({ value: value as TradeEmotion, label }))]}
        />
        <div className="col-span-2 md:col-span-3 form-field">
          <label htmlFor="trade-comment">Comentario</label>
          <textarea
            id="trade-comment"
            rows={2}
            value={form.comment ?? ''}
            onChange={e => set('comment', e.target.value)}
            className={formInputClass}
          />
        </div>
      </div>
    </FormModal>
  )
}
