import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { CalendarDays, ExternalLink, Monitor, Moon, RefreshCw, Sun, Unplug } from 'lucide-react'
import { useTheme, type Theme } from '@context/ThemeContext'
import { useFeedback } from '@context/ToastContext'
import { teacherApi } from '@services/educraft'
import { del, get, post, type ApiResponse } from '@services/api'
import type { TeacherProfile } from '@services/types'
import type { ShellContext } from '@components/layout/AppShell'
import { Button, Card, CardHeader } from '@components/ui'
import { cn } from '@lib/cn'

const THEMES: Array<{ key: Theme; label: string; icon: ReactNode }> = [
  { key: 'light', label: 'Claro', icon: <Sun className="h-5 w-5" /> },
  { key: 'dark', label: 'Oscuro', icon: <Moon className="h-5 w-5" /> },
  { key: 'system', label: 'Sistema', icon: <Monitor className="h-5 w-5" /> },
]

interface GoogleStatus {
  configured: boolean
  connected: boolean
  calendarId: string | null
  lastSyncAt: string | null
  expiresAt: string | null
  needsReconnect: boolean
  message: string
}

interface OAuthUrlResult {
  enabled: boolean
  url: string | null
  state: string | null
  message: string
}

interface SyncResult {
  pushed: number
  skipped: number
  message: string
}

type ProfileWithGoogle = TeacherProfile & {
  teacherProfile: TeacherProfile['teacherProfile'] & { googleCalendar?: GoogleStatus }
}

async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const res = await promise
  if (!res.ok) throw new Error(res.error || 'No se pudo completar la operación')
  return res.data
}

export function PreferencesTab() {
  const { theme, setTheme } = useTheme()
  const { profile, setProfile } = useOutletContext<ShellContext>()
  const { success, error } = useFeedback()
  const [params, setParams] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const handled = useRef(false)

  const status = (profile as ProfileWithGoogle | null)?.teacherProfile?.googleCalendar

  const refreshProfile = async () => setProfile(await teacherApi.profile())

  useEffect(() => {
    const code = params.get('code')
    const state = params.get('state')
    if (!code || !state) {
      handled.current = false
      if (params.get('googleCalendar') === 'error') {
        error('Google Calendar', params.get('message') ?? 'No se pudo completar la autorización.')
      }
      return
    }
    if (handled.current) return
    handled.current = true
    const expected = sessionStorage.getItem('googleCalendarState')
    sessionStorage.removeItem('googleCalendarState')
    const exchange = async () => {
      try {
        if (expected && expected !== state) throw new Error('La autorización recibida no coincide con la solicitud')
        await unwrap(post('/teacher/google-calendar/callback', { code, state }))
        success('Google Calendar conectado', 'Tu agenda se sincronizará con tu cuenta.')
        await refreshProfile()
      } catch (err) {
        error('No se pudo conectar Google Calendar', (err as Error).message)
      } finally {
        const next = new URLSearchParams(params)
        next.delete('code')
        next.delete('state')
        setParams(next, { replace: true })
      }
    }
    void exchange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const connect = async () => {
    setBusy(true)
    try {
      const result = await unwrap(get<OAuthUrlResult>('/teacher/google-calendar/oauth-url'))
      if (!result.enabled || !result.url) {
        error('Sincronización no disponible', result.message)
        return
      }
      if (result.state) sessionStorage.setItem('googleCalendarState', result.state)
      window.location.href = result.url
    } catch (err) {
      error('No se pudo iniciar la conexión', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const syncNow = async () => {
    setBusy(true)
    try {
      const result = await unwrap(post<SyncResult>('/teacher/google-calendar/sync', {}))
      success('Sincronización completada', result.message)
      await refreshProfile()
    } catch (err) {
      error('No se pudo sincronizar', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const disconnect = async () => {
    setBusy(true)
    try {
      await unwrap(del('/teacher/google-calendar/disconnect'))
      success('Google Calendar desconectado')
      await refreshProfile()
    } catch (err) {
      error('No se pudo desconectar', (err as Error).message)
    } finally {
      setBusy(false)
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
        <CardHeader title="Calendario" subtitle="Sincronización con Google Calendar" />
        {!status?.configured ? (
          <div className="rounded-2xl border border-line bg-surface-2 p-3">
            <p className="text-sm font-semibold text-ink">Sincronización deshabilitada</p>
            <p className="mt-1 text-xs text-ink-3">
              El administrador aún no configuró las credenciales OAuth de Google Calendar. Mientras tanto, la exportación <b>.ics</b> sigue disponible.
            </p>
            <a href="/app/calendario" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-purple hover:underline">
              Ir a Calendario <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : status.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
              <CalendarDays className="h-5 w-5" />
              Conectado{status.calendarId && status.calendarId !== 'primary' ? ` a ${status.calendarId}` : ''}
            </div>
            {status.needsReconnect && (
              <p className="text-xs text-amber-600">Tu sesión expiró; vuelve a conectar para seguir sincronizando.</p>
            )}
            <p className="text-xs text-ink-3">
              {status.lastSyncAt
                ? `Última sincronización: ${new Date(status.lastSyncAt).toLocaleString('es-DO')}`
                : 'Todavía no se ha enviado la agenda.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="soft" loading={busy} icon={<RefreshCw className="h-4 w-4" />} onClick={syncNow}>
                Sincronizar ahora
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} icon={<Unplug className="h-4 w-4" />} onClick={disconnect}>
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-ink-3">{status.message}</p>
            <Button size="sm" loading={busy} icon={<CalendarDays className="h-4 w-4" />} onClick={connect}>
              Conectar con Google Calendar
            </Button>
          </div>
        )}
        <p className="mt-3 text-xs text-ink-3">
          Desde <b>Calendario → Exportar .ics</b> descargas tu agenda (clases, evaluaciones, entregas y feriados) para importarla en Google Calendar, Outlook o el calendario del teléfono.
        </p>
      </Card>
    </div>
  )
}
