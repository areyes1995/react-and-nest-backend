// ──────────────────────────────────────────────
// useEmailResendCooldown — Cooldown de 20s para reenvío de email
// Evita que el frontend solicite otro correo antes de 20 segundos.
// Persiste en localStorage para sobrevivir recargas.
// ──────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react'

export const RESEND_COOLDOWN_SECONDS = 20

const STORAGE_KEY_EMAIL = 'auth_email_resend_email'
const STORAGE_KEY_AT = 'auth_email_resend_at'

function getStoredState(): { email: string | null; at: number | null } {
  try {
    const email = localStorage.getItem(STORAGE_KEY_EMAIL)
    const atRaw = localStorage.getItem(STORAGE_KEY_AT)
    const at = atRaw ? Number(atRaw) : null
    if (!email || !at || Number.isNaN(at)) return { email: null, at: null }
    return { email: email.toLowerCase(), at }
  } catch {
    return { email: null, at: null }
  }
}

function computeRemaining(at: number | null): number {
  if (!at) return 0
  const elapsed = Math.floor((Date.now() - at) / 1000)
  return Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed)
}

export function useEmailResendCooldown() {
  const [cooldownEmail, setCooldownEmail] = useState<string | null>(() => getStoredState().email)
  const [remaining, setRemaining] = useState<number>(() => {
    const { at } = getStoredState()
    return computeRemaining(at)
  })

  // ─── Restaurar y limpiar si expiró ──────────
  useEffect(() => {
    const { email, at } = getStoredState()
    const rem = computeRemaining(at)
    if (rem > 0 && email) {
      setCooldownEmail(email)
      setRemaining(rem)
    } else if (at) {
      try {
        localStorage.removeItem(STORAGE_KEY_EMAIL)
        localStorage.removeItem(STORAGE_KEY_AT)
      } catch { /* ignore */ }
      setCooldownEmail(null)
      setRemaining(0)
    }
  }, [])

  // ─── Ticker cada segundo ─────────────────────
  useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          try {
            localStorage.removeItem(STORAGE_KEY_EMAIL)
            localStorage.removeItem(STORAGE_KEY_AT)
          } catch { /* ignore */ }
          setCooldownEmail(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [remaining])

  const trigger = useCallback((email: string) => {
    const normalized = email.trim().toLowerCase()
    if (!normalized) return
    try {
      localStorage.setItem(STORAGE_KEY_EMAIL, normalized)
      localStorage.setItem(STORAGE_KEY_AT, String(Date.now()))
    } catch { /* ignore */ }
    setCooldownEmail(normalized)
    setRemaining(RESEND_COOLDOWN_SECONDS)
  }, [])

  const isCooldownActive = useCallback(
    (email: string) => {
      const normalized = email.trim().toLowerCase()
      return Boolean(normalized && cooldownEmail === normalized && remaining > 0)
    },
    [cooldownEmail, remaining],
  )

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_EMAIL)
      localStorage.removeItem(STORAGE_KEY_AT)
    } catch { /* ignore */ }
    setCooldownEmail(null)
    setRemaining(0)
  }, [])

  return {
    remaining,
    cooldownEmail,
    trigger,
    isCooldownActive,
    clear,
    RESEND_COOLDOWN_SECONDS,
  }
}
