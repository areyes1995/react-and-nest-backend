import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '@services/auth'
import { Button, Field, Input } from '@components/ui'
import { AuthLayout } from './AuthLayout'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirm) return setError('Las contraseñas no coinciden.')
    setLoading(true)
    const res = await resetPassword(token, password)
    setLoading(false)
    if (res.ok) setDone(true)
    else setError(res.error || 'El enlace no es válido o expiró.')
  }

  return (
    <AuthLayout title="Nueva contraseña" subtitle="Elige una contraseña segura para tu cuenta.">
      {done ? (
        <div className="space-y-4">
          <p className="rounded-xl bg-soft-green px-3 py-2 text-sm text-emerald-700">¡Listo! Tu contraseña fue actualizada.</p>
          <Link to="/login" className="btn btn-primary">
            Iniciar sesión
          </Link>
        </div>
      ) : !token ? (
        <p className="text-sm text-ink-2">El enlace no es válido. Solicita uno nuevo desde “¿Olvidaste tu contraseña?”.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nueva contraseña">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          </Field>
          <Field label="Confirmar contraseña">
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
          </Field>
          {error && <p className="rounded-xl bg-soft-red px-3 py-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Guardar contraseña
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
