// ──────────────────────────────────────────────
// ForgotPassword — Solicitar correo de reset
// El usuario ingresa su email y recibe un enlace
// para restablecer su contraseña.
//
// El diseño sale del sistema de la academia:
// lienzo .auth-canvas, tarjeta .auth-card y la
// escala de formulario .auth-form de index.css.
// ──────────────────────────────────────────────

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'
import { requestPasswordReset } from '@services/auth'
import { FormAlert, FormButton, FormField, FormInput } from '@components/ui'
import AuthBrand from '@components/auth/AuthBrand'
import { useAppTranslation } from '@i18n/useAppTranslation'

export default function ForgotPassword() {
  const { t } = useAppTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await requestPasswordReset(email.trim().toLowerCase())
      if (!res.ok) {
        setError(res.error || 'No se pudo enviar el correo')
        return
      }
      setDone(true)
    } catch {
      setError('Error inesperado al solicitar el correo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-canvas flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="auth-card animate-scale-in">
        {!done ? (
          <>
            <header className="mb-7 flex flex-col items-center text-center">
              <AuthBrand />
              <h1 className="mb-2 mt-4 text-[1.35rem] font-bold text-[var(--text-primary)]">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="max-w-[32ch] text-sm leading-relaxed text-[var(--text-secondary)]">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="auth-form flex flex-col gap-4" noValidate>
              <FormField label="Correo electrónico" htmlFor="fp-email">
                <FormInput
                  id="fp-email"
                  type="email"
                  placeholder="tu@correo.com"
                  icon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  required
                  autoFocus
                  autoComplete="email"
                  disabled={submitting}
                />
              </FormField>

              {error && <FormAlert variant="error">{error}</FormAlert>}

              <FormButton className="auth-cta press mt-1" loading={submitting} loadingText="Enviando…">
                Enviar enlace
              </FormButton>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-[var(--text-secondary)] underline-offset-[3px] transition-colors hover:text-[var(--poker-gold)] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver al inicio de sesión
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center">
            <AuthBrand size={56} />

            <span className="mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </span>

            <h1 className="my-2.5 text-[1.35rem] font-bold text-[var(--text-primary)]">
              Revisa tu correo
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)]">
              Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu
              contraseña en breve.
            </p>

            <FormButton
              className="auth-cta press"
              onClick={() => navigate('/login', { replace: true })}
            >
              Volver al inicio de sesión
            </FormButton>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} {t('app.name')}
        </p>
      </div>
    </div>
  )
}
