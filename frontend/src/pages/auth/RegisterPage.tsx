import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { signup } from '@services/auth'
import { Button, Field, Input } from '@components/ui'
import { AuthLayout } from './AuthLayout'

export default function RegisterPage() {
  const { startSession } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '', institution: '' })
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.')
    setLoading(true)
    try {
      const res = await signup({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email.trim(),
        password: form.password,
        institution: form.institution || undefined,
      })
      if (res.session) {
        startSession(res.session)
        navigate('/app/ajustes?tab=anio&bienvenida=1', { replace: true })
      } else {
        setSent(true)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Revisa tu correo" subtitle="Te enviamos un enlace para validar tu cuenta.">
        <p className="text-sm text-ink-2">Cuando confirmes tu correo podrás iniciar sesión y configurar tu año escolar.</p>
        <Link to="/login" className="btn btn-primary mt-6">
          Ir a iniciar sesión
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Crea tu cuenta docente" subtitle="Empieza a planificar, evaluar y acompañar a tus estudiantes.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre">
            <Input value={form.firstName} onChange={set('firstName')} required minLength={2} />
          </Field>
          <Field label="Apellido">
            <Input value={form.lastName} onChange={set('lastName')} required minLength={2} />
          </Field>
        </div>
        <Field label="Correo electrónico">
          <Input type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        </Field>
        <Field label="Centro educativo" hint="Opcional">
          <Input value={form.institution} onChange={set('institution')} placeholder="Liceo…" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contraseña">
            <Input type="password" value={form.password} onChange={set('password')} required autoComplete="new-password" />
          </Field>
          <Field label="Confirmar contraseña">
            <Input type="password" value={form.confirm} onChange={set('confirm')} required autoComplete="new-password" />
          </Field>
        </div>
        {error && <p className="rounded-xl bg-soft-red px-3 py-2 text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={loading} icon={<UserPlus className="h-4 w-4" />}>
          Crear cuenta
        </Button>
        <p className="text-center text-sm text-ink-3">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand-pink hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
