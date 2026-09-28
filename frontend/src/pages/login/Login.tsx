// ──────────────────────────────────────────────
// Login — fondo completo (sin split izquierdo).
// El tapete (.auth-stage) ocupa toda la página;
// eslogan + logo de la antigua izquierda viven
// centrados sobre el mismo fondo, arriba del login.
// ──────────────────────────────────────────────

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { FormAlert, FormButton, FormField, FormInput, TextCarousel } from '@components/ui'
import AuthBrand from '@components/auth/AuthBrand'
import BrandMark from '@components/brand/BrandMark'
import { useAppTranslation } from '@i18n/useAppTranslation'
import { useLoginForm, useTextRotator } from './useLoginForm'

const STAGE_LINES = [
  'Estudia cada clase y practica la mano en la mesa.',
  'Recibe el análisis de cada decisión al instante.',
  'Tu progreso crece con cada mano que juegas.',
]

export default function Login() {
  const { t } = useAppTranslation()
  const {
    email,
    setEmail,
    password,
    setPassword,
    isSubmitting,
    effectiveError,
    clearError,
    cooldown,
    isBlockedByCooldown,
    showCooldownNotice,
    handleSubmit,
  } = useLoginForm()
  const [showPassword, setShowPassword] = useState(false)
  const line = useTextRotator(STAGE_LINES.length)

  return (
    <div className="auth-stage relative flex h-[100dvh] max-h-[100dvh] min-h-[100dvh] flex-col overflow-hidden overflow-y-auto lg:overflow-hidden">
      <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* Header flotante — marca + CTA registro */}
      <header className="relative z-10 flex h-14 w-full shrink-0 items-center justify-between gap-3 px-4 sm:h-[3.75rem] sm:px-6 lg:px-8">
        <Link to="/" aria-label="Volver a la portada" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <BrandMark size={24} />
          <span className="hidden text-[0.8125rem] font-bold tracking-tight text-white sm:inline sm:text-sm">{t('app.name')}</span>
        </Link>
        <p className="shrink-0 text-[0.75rem] text-white/70 sm:text-[0.8125rem]">
          <span className="hidden sm:inline">¿No tienes cuenta? </span>
          <Link to="/#planes" className="font-semibold text-[var(--poker-gold)] underline-offset-[3px] transition-colors hover:underline">
            Regístrate
          </Link>
        </p>
      </header>

      {/* Centro — eslogan + card login. En desktop lado a lado para no scrollear */}
      <div className="relative z-10 flex flex-1 min-h-0 flex-col items-center justify-center gap-5 overflow-hidden px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-center lg:gap-8 lg:px-8 xl:gap-12 xl:px-10">
        {/* Eslogan / marca — antes vivía en el aside */}
        <div className="flex w-full max-w-[22rem] shrink-0 flex-col items-center text-center sm:max-w-[26rem] lg:max-w-[24rem] lg:items-start lg:text-left xl:max-w-[26rem]">
          <div className="scale-90 sm:scale-100">
            <AuthBrand size={40} />
          </div>
          <h2 className="mt-3 text-balance text-[clamp(1.2rem,4.2vw,1.5rem)] font-[850] leading-[1.1] tracking-[-0.03em] text-white drop-shadow-[0_1px_12px_rgba(0,0,0,0.32)] sm:mt-4 sm:text-[clamp(1.35rem,2vw,1.7rem)] lg:mt-5 lg:text-[clamp(1.45rem,1.5vw,1.85rem)]">
            Domina el Texas Hold&apos;em <span className="bg-gradient-to-r from-[#F7C15A] to-[#F2A93B] bg-clip-text text-transparent">mano a mano</span>
          </h2>
          <div className="auth-rotator mt-2 w-full sm:mt-3">
            <TextCarousel items={STAGE_LINES} currentIndex={line} />
          </div>
        </div>

        {/* Card login — ex panel derecho, ahora flotante sobre el fondo completo */}
        <div className="flex w-full max-w-[92vw] shrink-0 flex-col rounded-2xl border border-white/10 bg-[var(--bg-panel)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.06)_inset] backdrop-blur sm:max-w-[26rem] sm:rounded-[1.5rem] sm:p-6 lg:max-w-[25rem] lg:p-6 xl:max-w-[26rem] xl:p-7">
          <h1 className="text-[1.35rem] font-[800] tracking-[-0.025em] text-[var(--text-primary)] sm:text-[1.5rem]">Inicia sesión</h1>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)] sm:text-[0.875rem]">Continúa tu ruta donde la dejaste.</p>

          <form onSubmit={handleSubmit} className="auth-form mt-5 flex flex-col gap-3 sm:mt-6 sm:gap-4" noValidate>
            <FormField label="Correo electrónico" htmlFor="login-email">
              <FormInput
                id="login-email"
                type="email"
                placeholder="tu@correo.com"
                icon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  clearError()
                }}
                required
                autoComplete="email"
                disabled={isSubmitting}
              />
            </FormField>

            <div className="form-field">
              <label htmlFor="login-password">Contraseña</label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-4 flex items-center text-[var(--text-muted)]">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input form-input--password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    clearError()
                  }}
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 flex items-center rounded p-0.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                >
                  {showPassword ? <Eye className="h-[1.125rem] w-[1.125rem]" /> : <EyeOff className="h-[1.125rem] w-[1.125rem]" />}
                </button>
              </div>
            </div>

            <div className="-mt-1 flex justify-end">
              <Link to="/forgot-password" className="text-[0.8125rem] font-medium text-[var(--text-secondary)] underline-offset-[3px] transition-colors hover:text-[var(--poker-gold)] hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {effectiveError && <FormAlert variant="error">{effectiveError}</FormAlert>}
            {showCooldownNotice && (
              <FormAlert variant="info">
                Correo enviado. Podrás volver a solicitarlo en <strong>{cooldown}s</strong>.
              </FormAlert>
            )}

            <FormButton
              className="auth-cta press mt-1"
              loading={isSubmitting}
              loadingText="Entrando…"
              disabled={isBlockedByCooldown}
              icon={!isBlockedByCooldown && <ArrowRight className="h-4 w-4" />}
            >
              {isBlockedByCooldown ? `Espera ${cooldown}s` : 'Entrar'}
            </FormButton>

            <div className="relative flex items-center gap-2 py-1 sm:gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-active)] to-[var(--border-active)]" />
              <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1 text-mini font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] sm:px-2.5 sm:text-caption">
                o continúa con
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[var(--border-active)] to-[var(--border-active)]" />
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  const base = import.meta.env.VITE_API_URL as string | undefined
                  if (base && !String(base).includes('localhost') && base !== 'http://localhost:3000/api/v1') {
                    window.location.href = `${String(base).replace(/\/$/, '')}/auth/google`
                  } else {
                    window.location.href = '/login?provider=google'
                  }
                }}
                disabled={isSubmitting}
                className="auth-social-btn press flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-active)] bg-[var(--bg-surface)] px-3 py-2.5 text-[0.8125rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)] hover:border-[#3A3E4A] hover:bg-[var(--bg-surface-hover)] disabled:opacity-50 sm:gap-2.5 sm:rounded-[0.875rem] sm:px-4 sm:py-[0.72rem] sm:text-[0.875rem]"
              >
                <span className="flex h-4 w-4 items-center justify-center sm:h-5 sm:w-5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </span>
                <span className="truncate">Continuar con Google</span>
              </button>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const base = import.meta.env.VITE_API_URL as string | undefined
                    if (base && !String(base).includes('localhost') && base !== 'http://localhost:3000/api/v1') {
                      window.location.href = `${String(base).replace(/\/$/, '')}/auth/facebook`
                    } else {
                      window.location.href = '/login?provider=facebook'
                    }
                  }}
                  disabled={isSubmitting}
                  className="auth-social-btn press flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-active)] bg-[var(--bg-surface)] px-2 py-2.5 text-[0.8125rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)] hover:border-[#3A3E4A] hover:bg-[var(--bg-surface-hover)] disabled:opacity-50 sm:gap-2 sm:rounded-[0.875rem] sm:px-3 sm:py-[0.72rem] sm:text-[0.875rem]"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" fill="#1877F2" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="truncate">Facebook</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const base = import.meta.env.VITE_API_URL as string | undefined
                    if (base && !String(base).includes('localhost') && base !== 'http://localhost:3000/api/v1') {
                      window.location.href = `${String(base).replace(/\/$/, '')}/auth/instagram`
                    } else {
                      window.location.href = '/login?provider=instagram'
                    }
                  }}
                  disabled={isSubmitting}
                  className="auth-social-btn press flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-active)] bg-[var(--bg-surface)] px-2 py-2.5 text-[0.8125rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)] hover:border-[#3A3E4A] hover:bg-[var(--bg-surface-hover)] disabled:opacity-50 sm:gap-2 sm:rounded-[0.875rem] sm:px-3 sm:py-[0.72rem] sm:text-[0.875rem]"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true">
                    <defs>
                      <linearGradient id="ig-login-full" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#feda75" />
                        <stop offset="25%" stopColor="#fa7e1e" />
                        <stop offset="50%" stopColor="#d62976" />
                        <stop offset="75%" stopColor="#962fbf" />
                        <stop offset="100%" stopColor="#4f5bd5" />
                      </linearGradient>
                    </defs>
                    <path fill="url(#ig-login-full)" d="M12 0C8.74 0 8.333.015 7.053.072 5.775.13 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.13 5.775.072 7.053.015 8.333 0 8.74 0 12s.015 3.667.072 4.947c.057 1.278.261 2.148.558 2.913.306.789.718 1.459 1.384 2.126.667.667 1.337 1.078 2.126 1.384.765.297 1.635.5 2.913.558C8.333 23.985 8.74 24 12 24s3.667-.015 4.947-.072c1.278-.058 2.148-.261 2.913-.558.789-.306 1.459-.718 2.126-1.384.667-.667 1.078-1.337 1.384-2.126.297-.765.5-1.635.558-2.913C23.985 15.667 24 15.26 24 12s-.015-3.667-.072-4.947c-.058-1.278-.261-2.148-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319.935 20.649.525 19.86.22c-.765-.297-1.635-.5-2.913-.558C15.667.015 15.26 0 12 0zm0 2.16c3.203 0 3.585.012 4.85.07 1.17.054 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.058 1.265.07 1.646.07 4.85s-.012 3.585-.07 4.85c-.053 1.17-.249 1.805-.413 2.227-.217.562-.477.96-.896 1.382-.42.419-.819.679-1.381.896-.422.164-1.057.36-2.227.413-1.265.058-1.646.07-4.85.07s-3.585-.012-4.85-.07c-1.17-.053-1.805-.249-2.227-.413-.562-.217-.96-.477-1.382-.896-.419-.42-.679-.819-.896-1.381-.164-.422-.36-1.057-.413-2.227-.058-1.265-.07-1.646-.07-4.85s.012-3.585.07-4.85c.053-1.17.249-1.805.413-2.227.217-.562.477-.96.896-1.382.42-.419.819-.679 1.381-.896.422-.164 1.057-.36 2.227-.413 1.265-.058 1.646-.07 4.85-.07zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.844a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z" />
                  </svg>
                  <span className="truncate">Instagram</span>
                </button>
              </div>
            </div>
          </form>

          <p className="mt-5 text-center text-caption text-[var(--text-muted)] sm:mt-6 sm:text-xs">&copy; {new Date().getFullYear()} {t('app.name')}</p>
        </div>
      </div>
    </div>
  )
}
