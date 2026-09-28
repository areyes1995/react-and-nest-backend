// ──────────────────────────────────────────────
// ResetPassword — Cambio de contraseña
// Llega desde el email de "password-change" con un token.
// Al completarse, valida el correo y permite iniciar sesión.
//
// El diseño sale del sistema de la academia:
// lienzo .auth-canvas, tarjeta .auth-card y la
// escala de formulario .auth-form de index.css.
// ──────────────────────────────────────────────

import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Repeat } from 'lucide-react'
import { resetPassword } from '@services/auth'
import { FormAlert, FormButton } from '@components/ui'
import AuthBrand from '@components/auth/AuthBrand'
import { useAppTranslation } from '@i18n/useAppTranslation'

/**
 * Campo de contraseña con icono izquierdo y toggle de visibilidad.
 * Usa .form-input del sistema para heredar tema y foco dorado; el
 * hueco de los dos iconos lo da .form-input--password.
 */
function PasswordField({
  id,
  label,
  icon,
  show,
  onToggle,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string
  label: string
  icon: ReactNode
  show: boolean
  onToggle: () => void
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  disabled?: boolean
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-4 flex items-center text-[var(--text-muted)]">
          {icon}
        </span>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="form-input form-input--password"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          disabled={disabled}
          minLength={8}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-3 flex items-center rounded p-0.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          {show ? <Eye className="h-[1.125rem] w-[1.125rem]" /> : <EyeOff className="h-[1.125rem] w-[1.125rem]" />}
        </button>
      </div>
    </div>
  )
}

/** Un requisito de la contraseña, con su punto de estado. */
function Requirement({ met, children }: { met: boolean; children: ReactNode }) {
  return (
    <li
      className={`flex items-center gap-2 transition-colors ${
        met ? 'text-emerald-400' : 'text-[var(--text-muted)]'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full transition-colors ${
          met ? 'bg-emerald-400' : 'bg-[var(--text-muted)]'
        }`}
      />
      {children}
    </li>
  )
}

export default function ResetPassword() {
  const { t } = useAppTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('El enlace no es válido. Solicita uno nuevo.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await resetPassword(token, password)
      if (!res.ok) {
        setError(res.error || 'No se pudo cambiar la contraseña.')
        return
      }
      setDone(true)
    } catch {
      setError('Error inesperado al cambiar la contraseña.')
    } finally {
      setSubmitting(false)
    }
  }

  const hasToken = Boolean(token)

  return (
    <div className="auth-canvas flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="auth-card animate-scale-in">
        {!done ? (
          <>
            <header className="mb-7 flex flex-col items-center text-center">
              <AuthBrand />
              <h1 className="mb-2 mt-4 text-[1.35rem] font-bold text-[var(--text-primary)]">
                Establece tu contraseña
              </h1>
              <p className="max-w-[34ch] text-sm leading-relaxed text-[var(--text-secondary)]">
                Crea una nueva contraseña para tu cuenta. Al hacerlo, tu correo quedará validado y
                podrás iniciar sesión.
              </p>
            </header>

            {!hasToken && (
              <div className="mb-4">
                <FormAlert variant="error">
                  El enlace no es válido o ha expirado. Solicita uno nuevo desde el inicio de sesión.
                </FormAlert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form flex flex-col gap-4" noValidate>
              <PasswordField
                id="rp-password"
                label="Nueva contraseña"
                icon={<Lock className="h-4 w-4" />}
                show={show}
                onToggle={() => setShow(s => !s)}
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                placeholder="Al menos 8 caracteres"
                disabled={submitting || !hasToken}
              />

              {password.length > 0 && (
                <ul className="-mt-1 flex flex-col gap-1.5 text-xs">
                  <Requirement met={password.length >= 8}>Al menos 8 caracteres</Requirement>
                  <Requirement met={password === confirm && confirm.length > 0}>
                    Las contraseñas coinciden
                  </Requirement>
                </ul>
              )}

              <PasswordField
                id="rp-confirm"
                label="Confirmar contraseña"
                icon={<Repeat className="h-4 w-4" />}
                show={show}
                onToggle={() => setShow(s => !s)}
                value={confirm}
                onChange={e => {
                  setConfirm(e.target.value)
                  setError(null)
                }}
                placeholder="Repite la contraseña"
                disabled={submitting || !hasToken}
              />

              {error && <FormAlert variant="error">{error}</FormAlert>}

              <FormButton className="auth-cta press mt-1" loading={submitting} loadingText="Guardando…">
                Cambiar contraseña
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
              Contraseña actualizada
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)]">
              Tu contraseña fue cambiada correctamente y tu correo quedó validado. Ya puedes iniciar
              sesión.
            </p>

            <FormButton
              className="auth-cta press"
              onClick={() => navigate('/login', { replace: true })}
            >
              Iniciar sesión
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
