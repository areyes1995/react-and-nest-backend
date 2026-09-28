import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  hasPermission,
  hasAnyRole,
  isAdminUser,
  preValidateCredentials,
  getAuthMethodLabel,
} from '@services/auth'

describe('auth helpers', () => {
  describe('hasPermission', () => {
    it('true si el permiso está incluido', () => {
      expect(hasPermission({ permissions: ['module:coaching'] }, 'module:coaching')).toBe(true)
    })
    it('false si falta o user nulo', () => {
      expect(hasPermission({ permissions: [] }, 'x')).toBe(false)
      expect(hasPermission(null, 'x')).toBe(false)
      expect(hasPermission(undefined, 'x')).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    const user = { roles: ['admin'], role: 'admin' }
    it('case-insensitive y une roles+role', () => {
      expect(hasAnyRole(user, 'ADMIN')).toBe(true)
      expect(hasAnyRole({ role: 'User', roles: [] }, 'user')).toBe(true)
      expect(hasAnyRole(user, 'GUEST')).toBe(false)
      expect(hasAnyRole(null)).toBe(false)
    })
  })

  describe('isAdminUser', () => {
    it('USER no es admin', () => {
      const u = { role: 'USER', roles: ['USER'] }
      expect(isAdminUser(u)).toBe(false)
    })
    it('ADMIN y SUPERADMIN son admin', () => {
      expect(isAdminUser({ role: 'ADMIN', roles: [] })).toBe(true)
      expect(isAdminUser({ role: '', roles: ['superadmin'] })).toBe(true)
      expect(isAdminUser(null)).toBe(false)
    })
    it('GUEST no gestiona ni administra', () => {
      const u = { role: 'GUEST', roles: ['GUEST'] }
      expect(canManageContent(u)).toBe(false)
      expect(isAdminUser(u)).toBe(false)
    })
  })

  describe('preValidateCredentials', () => {
    it('email requerido y password requerida', () => {
      expect(preValidateCredentials({ email: '', password: 'x' }).valid).toBe(false)
      expect(preValidateCredentials({ email: 'a@b.c', password: '' }).valid).toBe(false)
    })
    it('formato de email inválido', () => {
      const r = preValidateCredentials({ email: 'no-email', password: '1234' })
      expect(r).toEqual({ valid: false, error: 'El formato del correo no es válido' })
    })
    it('password mínima 4 caracteres', () => {
      const r = preValidateCredentials({ email: 'a@b.c', password: '123' })
      expect(r.valid).toBe(false)
      expect(r.error).toContain('4 caracteres')
    })
    it('válidas → valid true', () => {
      expect(preValidateCredentials({ email: 'a@b.c', password: '1234' })).toEqual({
        valid: true,
      })
    })
  })

  describe('getAuthMethodLabel', () => {
    it('retorna un label no vacío', () => {
      expect(typeof getAuthMethodLabel()).toBe('string')
    })
  })
})

describe('auth api (mock)', () => {
  beforeEach(() => vi.resetModules())

  it('login lanza si el backend responde !ok', async () => {
    vi.doMock('@services/api', () => ({
      post: vi.fn().mockResolvedValue({ ok: false, error: 'bad' }),
      get: vi.fn(),
      MOCK_ENABLED: false,
    }))
    const { login } = await import('@services/auth')
    await expect(login({ email: 'a@b.c', password: '1234' })).rejects.toThrow(
      'bad',
    )
  })
})
