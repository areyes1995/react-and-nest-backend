// ──────────────────────────────────────────────
// TableThemePicker — selector de estilo de mesa.
// Vive en la configuración de cada mesa. Dos
// acciones:
//  · Usar: la mesa cambia solo para quien la mira
//    (todos los usuarios; vale en todas sus mesas).
//  · Predeterminar: la mesa que ve todo el mundo
//    (solo ADMIN y SUPERADMIN).
// Cada opción se enseña como una mesa en miniatura,
// dibujada con los mismos componentes que la real.
// ──────────────────────────────────────────────

import { useState } from 'react'
import { parseCards } from '@poker/engine'
import { Check, Eye, Star } from 'lucide-react'
import PlayingCard from './PlayingCard'
import { TableFelt } from './PokerTable'
import {
  TableThemeScope,
  useTableThemeSettings,
} from '@features/table/TableThemeContext'
import { TABLE_THEMES, findTableTheme, type TableTheme } from '@features/table/themes'

const SHAPE_LABELS: Record<TableTheme['shape'], string> = {
  oval: 'Ovalada',
  stadium: 'Estadio',
  rectangle: 'Rectangular',
  octagon: 'Octogonal',
}

/** Un palo de cada: así se ve de un vistazo si la baraja es de cuatro colores. */
const SAMPLE_CARDS = parseCards('As Kd Qc')

function ThemeThumbnail({ theme }: { theme: TableTheme }) {
  return (
    <TableThemeScope theme={theme} className="relative w-full aspect-[16/9]">
      <TableFelt theme={theme} />
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex gap-0.5 scale-[0.8]">
          {SAMPLE_CARDS.map(card => (
            <PlayingCard key={card} card={card} size="xs" />
          ))}
          <PlayingCard size="xs" faceDown />
        </div>
      </div>
    </TableThemeScope>
  )
}

export default function TableThemePicker() {
  const settings = useTableThemeSettings()
  const [saving, setSaving] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  if (!settings) return null

  const { theme, defaultThemeId, previewThemeId, source, canCustomize } = settings
  const defaultName = findTableTheme(defaultThemeId)?.name ?? defaultThemeId

  async function makeDefault(id: string) {
    if (!settings) return
    setSaving(id)
    setNotice(null)
    const persisted = await settings.setDefault(id)
    // Tras fijarlo, el administrador ve lo mismo que todos.
    settings.preview(null)
    setSaving(null)
    setNotice(
      persisted
        ? `«${findTableTheme(id)?.name}» es ahora la mesa de todos los usuarios.`
        : 'Sin conexión con el backend: guardado solo en este navegador.',
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-caption leading-snug text-[var(--text-muted)]">
        Elige cómo ves tus mesas; el cambio es solo para ti.
        {canCustomize && (
          <>
            {' '}Como administrador, <b className="text-[var(--text-secondary)]">Predeterminar</b> la cambia
            para todos los usuarios. Ahora ven: <b className="text-[var(--text-secondary)]">{defaultName}</b>.
          </>
        )}
      </p>

      {previewThemeId && previewThemeId !== defaultThemeId && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--poker-gold)]/40 bg-[var(--poker-gold)]/10 px-2.5 py-1.5">
          <span className="text-caption text-[var(--text-secondary)]">Estás usando «{theme.name}».</span>
          <button
            type="button"
            onClick={() => settings.preview(null)}
            className="text-caption font-semibold text-[var(--poker-gold)] hover:underline shrink-0"
          >
            Volver a la de la academia
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {TABLE_THEMES.map(option => {
          const active = option.id === theme.id
          const isDefault = option.id === defaultThemeId
          return (
            <div
              key={option.id}
              className={`rounded-lg border p-1.5 transition ${
                active
                  ? 'border-[var(--poker-gold)] bg-[var(--bg-surface)]'
                  : 'border-[var(--border)] hover:border-[var(--border-active)]'
              }`}
            >
              <button
                type="button"
                onClick={() => settings.preview(option.id === defaultThemeId ? null : option.id)}
                className="block w-full text-left"
                title={option.inspiration}
                aria-pressed={active}
              >
                <ThemeThumbnail theme={option} />
                <span className="mt-1 flex items-center gap-1 text-caption font-semibold text-[var(--text-primary)]">
                  {active && <Eye className="w-3 h-3 text-[var(--poker-gold)]" strokeWidth={2} />}
                  <span className="truncate">{option.name}</span>
                </span>
                <span className="block text-micro text-[var(--text-muted)] truncate">
                  {SHAPE_LABELS[option.shape]} · {option.fourColor ? '4 colores' : '2 colores'}
                </span>
              </button>
              {canCustomize &&
                (isDefault ? (
                  <span className="mt-1 flex items-center justify-center gap-1 rounded-md bg-[var(--poker-gold)]/15 py-1 text-mini font-semibold text-[var(--poker-gold)]">
                    <Check className="w-3 h-3" strokeWidth={2.5} />
                    Predeterminada
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={saving !== null}
                    onClick={() => makeDefault(option.id)}
                    className="mt-1 flex w-full items-center justify-center gap-1 rounded-md bg-[var(--bg-surface)] py-1 text-mini font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] disabled:opacity-50 transition"
                  >
                    <Star className="w-3 h-3" strokeWidth={2} />
                    {saving === option.id ? 'Guardando…' : 'Predeterminar'}
                  </button>
                ))}
            </div>
          )
        })}
      </div>

      <p className="text-mini text-[var(--text-muted)] leading-snug">{theme.inspiration}</p>

      {notice && <p className="text-caption text-[var(--text-secondary)]">{notice}</p>}
      {!notice && canCustomize && source === 'local' && (
        <p className="text-mini text-amber-400/90 leading-snug">
          El backend no guarda todavía el estilo (¿migración pendiente?): la elección vale solo en
          este navegador.
        </p>
      )}
    </div>
  )
}
