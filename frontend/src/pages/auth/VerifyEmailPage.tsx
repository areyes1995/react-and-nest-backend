import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '@services/auth'
import { Spinner } from '@components/ui'
import { AuthLayout } from './AuthLayout'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState<'loading' | 'ok' | 'error'>(token ? 'loading' : 'error')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return
    verifyEmail(token).then((res) => {
      setState(res.ok ? 'ok' : 'error')
      setMessage(res.error ?? '')
    })
  }, [token])

  return (
    <AuthLayout title="Validación de correo">
      {state === 'loading' && <Spinner label="Validando…" />}
      {state === 'ok' && (
        <div className="space-y-4">
          <p className="rounded-xl bg-soft-green px-3 py-2 text-sm text-emerald-700">¡Tu correo fue validado!</p>
          <Link to="/login" className="btn btn-primary">
            Iniciar sesión
          </Link>
        </div>
      )}
      {state === 'error' && (
        <div className="space-y-4">
          <p className="rounded-xl bg-soft-red px-3 py-2 text-sm text-red-600">{message || 'El enlace no es válido o expiró.'}</p>
          <Link to="/login" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      )}
    </AuthLayout>
  )
}
