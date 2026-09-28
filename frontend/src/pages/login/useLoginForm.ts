// ──────────────────────────────────────────────
// useLoginForm — toda la lógica de la pantalla de
// acceso, sin una sola decisión visual.
// Las variantes (Login1, Login2) solo cambian el
// panel derecho; el formulario, el cooldown de
// reenvío de correo y el redirect son los mismos,
// así que viven aquí una sola vez.
// ──────────────────────────────────────────────

import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { readRedirect } from '@services/auth-redirect'
import { useEmailResendCooldown } from '@hooks/useEmailResendCooldown'

const EMAIL_SENT_PATTERN = /Te hemos enviado un correo/

export function useLoginForm() {
  const { login, isAuthenticated, isSubmitting, error, clearError } = useAuth()
  const navigate = useNavigate()
  const { remaining: cooldown, trigger: triggerCooldown, isCooldownActive } = useEmailResendCooldown()
  const [lastEmailError, setLastEmailError] = useState<string | null>(null)
  const lastSubmittedEmailRef = useRef<string>('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // ─── Redirigir si ya está autenticado ────────
  useEffect(() => {
    if (isAuthenticated) {
      navigate(readRedirect('/app'), { replace: true })
    }
  }, [isAuthenticated, navigate])

  // ─── Detectar envío de correo y activar cooldown de 20s ────
  useEffect(() => {
    if (error && EMAIL_SENT_PATTERN.test(error)) {
      const normalized = (lastSubmittedEmailRef.current || email).trim().toLowerCase()
      if (normalized) {
        triggerCooldown(normalized)
        setLastEmailError(error)
      }
    }
  }, [error, email, triggerCooldown])

  // ─── Limpiar lastEmailError cuando expira el cooldown ────
  useEffect(() => {
    if (cooldown === 0) {
      setLastEmailError(null)
    }
  }, [cooldown])

  const normalizedEmail = email.trim().toLowerCase()
  const isBlockedByCooldown = Boolean(
    normalizedEmail && isCooldownActive(normalizedEmail),
  )

  // Mensaje efectivo: añade countdown al mensaje de correo enviado
  const effectiveError = (() => {
    if (error && EMAIL_SENT_PATTERN.test(error) && isBlockedByCooldown) {
      return `${error} Podrás solicitar otro correo en ${cooldown}s.`
    }
    return error
  })()

  // Aviso cuando el error ya se limpió pero el cooldown sigue corriendo.
  const showCooldownNotice = isBlockedByCooldown && cooldown > 0 && !error && Boolean(lastEmailError)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    if (isBlockedByCooldown) return
    lastSubmittedEmailRef.current = email.trim()
    login({ email: email.trim(), password })
  }

  return {
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
  }
}

/** Índice que avanza en bucle cada `intervalMs`. Para los carruseles de texto. */
export function useTextRotator(length: number, intervalMs = 3500) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (length <= 1) return
    const id = setInterval(() => setIndex(i => (i + 1) % length), intervalMs)
    return () => clearInterval(id)
  }, [length, intervalMs])
  return index
}
