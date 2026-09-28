// ──────────────────────────────────────────────
// VerifyEmail — Validación de correo electrónico
// Llega desde el email de "verify-email" con un token.
// Al validar, permite iniciar sesión.
//
// El diseño sale del sistema de la academia:
// lienzo .auth-canvas y tarjeta .auth-card de
// index.css.
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { verifyEmail } from '@services/auth'
import { FormButton } from '@components/ui'
import AuthBrand from '@components/auth/AuthBrand'
import { useAppTranslation } from '@i18n/useAppTranslation'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmail() {
  const { t } = useAppTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('El enlace no es válido o ha expirado.')
      return
    }
    let active = true
    ;(async () => {
      try {
        const res = await verifyEmail(token)
        if (!active) return
        if (res.ok) {
          setStatus('success')
        } else {
          setStatus('error')
          setMessage(res.error || 'No se pudo validar el correo.')
        }
      } catch {
        if (!active) return
        setStatus('error')
        setMessage('No se pudo validar el correo.')
      }
    })()
    return () => { active = false }
  }, [token])

  return (
    <div className="auth-canvas flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="auth-card animate-scale-in flex flex-col items-center text-center">
        <AuthBrand />

        {status === 'loading' && (
          <>
            <span className="mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--poker-gold)]/15 text-[var(--poker-gold)]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </span>
            <h1 className="my-2.5 text-[1.35rem] font-bold text-[var(--text-primary)]">
              Validando tu correo
            </h1>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Estamos confirmando tu dirección de correo electrónico.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <span className="mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h1 className="my-2.5 text-[1.35rem] font-bold text-[var(--text-primary)]">
              Correo validado
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)]">
              Tu correo electrónico fue confirmado correctamente. Ya puedes iniciar sesión.
            </p>
            <FormButton
              className="auth-cta press"
              onClick={() => navigate('/login', { replace: true })}
            >
              Iniciar sesión
            </FormButton>
          </>
        )}

        {status === 'error' && (
          <>
            <span className="mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <XCircle className="h-8 w-8" />
            </span>
            <h1 className="my-2.5 text-[1.35rem] font-bold text-[var(--text-primary)]">
              No se pudo validar
            </h1>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {message || 'El enlace no es válido o ha expirado.'}
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-[var(--text-secondary)] underline-offset-[3px] transition-colors hover:text-[var(--poker-gold)] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}

        <p className="mt-8 text-xs text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} {t('app.name')}
        </p>
      </div>
    </div>
  )
}
