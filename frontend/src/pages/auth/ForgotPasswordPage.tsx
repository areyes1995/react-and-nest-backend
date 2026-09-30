import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '@services/auth'
import { Button, Field, Input } from '@components/ui'
import { AuthLayout } from './AuthLayout'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await requestPasswordReset(email.trim()).catch(() => undefined)
    setLoading(false)
    setDone(true)
  }

  return (
    <AuthLayout title="Recupera tu contraseña" subtitle="Te enviaremos un enlace para crear una nueva.">
      {done ? (
        <div className="space-y-4">
          <p className="rounded-xl bg-soft-green px-3 py-2 text-sm text-emerald-700">
            Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
          </p>
          <Link to="/login" className="btn btn-primary">
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Correo electrónico">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Enviar enlace
          </Button>
          <Link to="/login" className="link block text-center">
            Volver
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}
