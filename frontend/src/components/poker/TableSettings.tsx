// ──────────────────────────────────────────────
// TableSettings — el engranaje de cada mesa.
// Un botón en la esquina del tapete que abre la
// configuración en un modal. Lo que se cambia aquí
// (fichas o BB, abreviar cantidades, avisos, estilo
// de mesa) vale para TODAS las mesas a la vez: vive
// en TableDisplayContext y TableThemeContext.
//
// Cada mesa puede añadir su propia pestaña (la de
// práctica pone ahí la partida: rivales, ciegas,
// velocidad…), que sí es solo de esa mesa.
// ──────────────────────────────────────────────

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Coins, Palette, Settings, SlidersHorizontal, X } from 'lucide-react'
import Modal from '@components/ui/modal/Modal'
import { TableThemeScope } from '@features/table/TableThemeContext'
import { formatAmount, useTableDisplay, type ChipUnit } from '@features/table/TableDisplayContext'
import TableThemePicker from './TableThemePicker'

/** Pestaña propia de una mesa, antes de las generales. */
export interface TableSettingsExtra {
  title: string
  content: ReactNode
}

type TabId = 'extra' | 'display' | 'theme'

const UNITS: { id: ChipUnit; label: string; hint: string }[] = [
  { id: 'chips', label: 'Fichas', hint: 'Cantidades tal cual: 5.000, 150…' },
  { id: 'bb', label: 'Ciegas grandes (BB)', hint: 'Todo en BB: 100 BB, 3 BB…' },
]

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        className="mt-0.5 accent-[var(--poker-gold)]"
      />
      <span className="text-xs text-[var(--text-secondary)]">
        {label}
        {hint && <span className="block text-mini text-[var(--text-muted)] leading-snug">{hint}</span>}
      </span>
    </label>
  )
}

function DisplaySettings({ bigBlind }: { bigBlind?: number }) {
  const { prefs, update } = useTableDisplay()
  // Ejemplo con las ciegas de esta mesa: así se ve qué cambia antes de cerrar.
  const blind = bigBlind ?? 50
  const sample = blind * 100

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <span className="text-caption font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Mostrar cantidades en
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {UNITS.map(unit => (
            <button
              key={unit.id}
              type="button"
              onClick={() => update({ unit: unit.id })}
              aria-pressed={prefs.unit === unit.id}
              className={`rounded-lg px-2.5 py-2 text-left transition ${
                prefs.unit === unit.id
                  ? 'bg-[var(--poker-gold)] text-black'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <span className="block text-xs font-semibold">{unit.label}</span>
              <span className={`block text-mini ${prefs.unit === unit.id ? 'text-black/70' : 'text-[var(--text-muted)]'}`}>
                {unit.hint}
              </span>
            </button>
          ))}
        </div>
        <p className="text-mini text-[var(--text-muted)] leading-snug">
          Ejemplo con ciegas de {blind}: un stack de {formatAmount(sample, { ...prefs, unit: 'chips' })} se ve como{' '}
          <b className="text-[var(--text-secondary)]">{formatAmount(sample, prefs, blind)}</b>. Pensar en BB es
          lo que hacen los profesionales: el tamaño del stack importa respecto a las ciegas, no en fichas.
        </p>
      </div>

      <div className="space-y-2.5 border-t border-[var(--border)] pt-3">
        <Toggle
          checked={prefs.compact}
          onChange={value => update({ compact: value })}
          label="Abreviar cantidades grandes"
          hint="12.500 → 12.5k. Desactívalo para ver la cifra exacta."
        />
        <Toggle
          checked={prefs.showToCall}
          onChange={value => update({ showToCall: value })}
          label="Mostrar lo que te piden para seguir"
          hint="El aviso «Te piden X para seguir» en el centro de la mesa."
        />
      </div>
    </div>
  )
}

export interface TableSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  /** Ciega grande de la mesa, para el ejemplo de BB. */
  bigBlind?: number
  extra?: TableSettingsExtra
}

export function TableSettingsModal({ isOpen, onClose, bigBlind, extra }: TableSettingsModalProps) {
  const [tab, setTab] = useState<TabId>(extra ? 'extra' : 'display')

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  const tabs: { id: TabId; label: string; icon: typeof Coins }[] = [
    ...(extra ? [{ id: 'extra' as const, label: extra.title, icon: SlidersHorizontal }] : []),
    { id: 'display', label: 'Cantidades y avisos', icon: Coins },
    { id: 'theme', label: 'Estilo de mesa', icon: Palette },
  ]
  const active = tabs.some(item => item.id === tab) ? tab : tabs[0].id

  // En un portal: la mesa puede estar escalada y un `fixed` dentro de un
  // elemento transformado dejaría de cubrir la pantalla. El scope conserva
  // los colores del estilo de mesa activo dentro del modal.
  return createPortal(
    <TableThemeScope>
      {/* Las teclas no llegan a la mesa mientras el modal está abierto (F, C, R, 1-2-3…). */}
      <div onKeyDown={event => event.key !== 'Escape' && event.stopPropagation()}>
        <Modal isOpen onClose={onClose} maxWidth="max-w-xl" maxHeight="max-h-[92dvh]">
          <div role="dialog" aria-modal="true" aria-label="Configuración de la mesa">
            <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg-panel)] px-4 pt-4">
              <div className="flex items-start gap-2">
                <Settings className="mt-0.5 h-4 w-4 shrink-0 text-[var(--poker-gold)]" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Configuración de la mesa</h2>
                  <p className="text-caption text-[var(--text-muted)]">
                    Cantidades, avisos y estilo se aplican a todas tus mesas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex gap-1 overflow-x-auto" role="tablist">
                {tabs.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active === item.id}
                    onClick={() => setTab(item.id)}
                    className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 pb-2 text-xs font-semibold transition ${
                      active === item.id
                        ? 'border-[var(--poker-gold)] text-[var(--text-primary)]'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              {active === 'extra' && extra?.content}
              {active === 'display' && <DisplaySettings bigBlind={bigBlind} />}
              {active === 'theme' && <TableThemePicker />}
            </div>
          </div>
        </Modal>
      </div>
    </TableThemeScope>,
    document.body,
  )
}

export interface TableSettingsButtonProps {
  bigBlind?: number
  extra?: TableSettingsExtra
  className?: string
}

/** Engranaje que abre la configuración. */
export default function TableSettingsButton({ bigBlind, extra, className = '' }: TableSettingsButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Configuración de la mesa"
        aria-label="Configuración de la mesa"
        className={`grid place-items-center rounded-md bg-black/45 p-1.5 text-white/75 backdrop-blur-sm transition hover:bg-black/65 hover:text-white ${className}`}
      >
        <Settings className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <TableSettingsModal isOpen={open} onClose={() => setOpen(false)} bigBlind={bigBlind} extra={extra} />
    </>
  )
}
