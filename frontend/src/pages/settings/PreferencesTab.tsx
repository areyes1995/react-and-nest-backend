import { useOutletContext } from 'react-router-dom'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '@context/ThemeContext'
import { useFeedback } from '@context/ToastContext'
import { teacherApi } from '@services/educraft'
import type { ShellContext } from '@components/layout/AppShell'
import { Card, CardHeader, Toggle } from '@components/ui'
import { cn } from '@lib/cn'

const THEMES: Array<{ key: Theme; label: string; icon: React.ReactNode }> = [
  { key: 'light', label: 'Claro', icon: <Sun className="h-5 w-5" /> },
  { key: 'dark', label: 'Oscuro', icon: <Moon className="h-5 w-5" /> },
  { key: 'system', label: 'Sistema', icon: <Monitor className="h-5 w-5" /> },
]

export function PreferencesTab() {
  const { theme, setTheme } = useTheme()
  const { profile, setProfile } = useOutletContext<ShellContext>()
  const { success, error } = useFeedback()

  const toggleSync = async (value: boolean) => {
    try {
      setProfile(await teacherApi.updateProfile({ googleCalendarSync: value }))
      success('Preferencia guardada')
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="card-pad">
        <CardHeader title="Apariencia" subtitle="Tema de la interfaz" />
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <button key={t.key} onClick={() => setTheme(t.key)} className={cn('flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-sm font-semibold transition', theme === t.key ? 'border-brand-purple bg-soft-purple text-brand-purple' : 'border-line text-ink-2 hover:border-violet-200')}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </Card>
      <Card className="card-pad">
        <CardHeader title="Calendario" subtitle="Sincronización con Google Calendar u Outlook" />
        <Toggle checked={profile?.teacherProfile.googleCalendarSync ?? false} onChange={toggleSync} label="Mantener mi agenda disponible para Google Calendar" />
        <p className="mt-3 text-xs text-ink-3">
          Desde <b>Calendario → Exportar .ics</b> descargas tu agenda (clases, evaluaciones, entregas y feriados) para importarla en Google Calendar, Outlook o el calendario del teléfono.
        </p>
      </Card>
    </div>
  )
}
