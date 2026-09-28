import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEmailResendCooldown, RESEND_COOLDOWN_SECONDS } from '@hooks/useEmailResendCooldown'

describe('useEmailResendCooldown', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('constante de 20s', () => {
    expect(RESEND_COOLDOWN_SECONDS).toBe(20)
  })

  it('trigger inicia el cooldown en 20 y normaliza el email', () => {
    const { result } = renderHook(() => useEmailResendCooldown())
    act(() => {
      result.current.trigger('  ANA@Mail.COM ')
    })
    expect(result.current.remaining).toBe(20)
    expect(result.current.cooldownEmail).toBe('ana@mail.com')
    expect(result.current.isCooldownActive('ANA@mail.com')).toBe(true)
    expect(result.current.isCooldownActive('otro@mail.com')).toBe(false)
  })

  it('el ticker decrementa y al llegar a 0 limpia storage', () => {
    const { result } = renderHook(() => useEmailResendCooldown())
    act(() => {
      result.current.trigger('a@b.c')
    })
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.remaining).toBe(15)
    act(() => {
      vi.advanceTimersByTime(15000)
    })
    expect(result.current.remaining).toBe(0)
    expect(result.current.cooldownEmail).toBeNull()
    expect(localStorage.getItem('auth_email_resend_at')).toBeNull()
  })

  it('restaura desde localStorage si no expiró', () => {
    localStorage.setItem('auth_email_resend_email', 'x@y.z')
    localStorage.setItem('auth_email_resend_at', String(Date.now() - 10000))
    const { result } = renderHook(() => useEmailResendCooldown())
    expect(result.current.cooldownEmail).toBe('x@y.z')
    expect(result.current.remaining).toBeGreaterThan(0)
    expect(result.current.remaining).toBeLessThanOrEqual(20)
  })

  it('limpia storage si ya expiró', () => {
    localStorage.setItem('auth_email_resend_email', 'x@y.z')
    localStorage.setItem('auth_email_resend_at', String(Date.now() - 60000))
    const { result } = renderHook(() => useEmailResendCooldown())
    expect(result.current.remaining).toBe(0)
    expect(localStorage.getItem('auth_email_resend_email')).toBeNull()
  })

  it('clear resetea todo', () => {
    const { result } = renderHook(() => useEmailResendCooldown())
    act(() => {
      result.current.trigger('a@b.c')
    })
    act(() => {
      result.current.clear()
    })
    expect(result.current.remaining).toBe(0)
    expect(result.current.cooldownEmail).toBeNull()
    expect(result.current.isCooldownActive('a@b.c')).toBe(false)
  })

  it('trigger vacío no hace nada', () => {
    const { result } = renderHook(() => useEmailResendCooldown())
    act(() => {
      result.current.trigger('   ')
    })
    expect(result.current.remaining).toBe(0)
  })
})
