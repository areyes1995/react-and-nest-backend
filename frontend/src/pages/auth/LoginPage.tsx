import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { Button, Field, Input } from '@components/ui'
import { AuthLayout } from './AuthLayout'

export default function LoginPage() {
  const { login, isSubmitting, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await login({ email: email.trim(), password })
  }

  return (
    <AuthLayout title="¡Bienvenido de vuelta!" subtitle="Inicia sesión para continuar con tus clases.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Correo electrónico">
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) clearError()
            }}
            placeholder="docente@centro.edu.do"
            required
          />
        </Field>
        <Field label="Contraseña">
          <div className="relative">
            <Input
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) clearError()
              }}
              placeholder="••••••••"
              required
              className="pr-10"
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" aria-label="Mostrar contraseña">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        {error && <p className="rounded-xl bg-soft-red px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Link to="/forgot-password" className="link">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} icon={<LogIn className="h-4 w-4" />}>
          Iniciar sesión
        </Button>
        <p className="text-center text-sm text-ink-3">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-brand-pink hover:underline">
            Crear cuenta docente
          </Link>
        </p>
        {import.meta.env.DEV && (
          <p className="rounded-xl bg-surface-3 px-3 py-2 text-center text-xs text-ink-3">
            Demo: <span className="font-mono">docente@educraft.app</span> / <span className="font-mono">Educraft2025!</span>
          </p>
        )}
      </form>
    </AuthLayout>
  )
}
