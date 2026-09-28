import { describe, it, expect, vi, beforeEach } from 'vitest'
import { get, post, setUnauthorizedHandler } from '@services/api'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

describe('api service', () => {
  beforeEach(() => {
    localStorage.clear()
    setUnauthorizedHandler(null)
    vi.restoreAllMocks()
  })

  it('envía Authorization cuando hay token', async () => {
    localStorage.setItem('auth_token', 'abc')
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ ok: true }))
    const res = await get('/projects', { page: 1 })
    expect(res.ok).toBe(true)
    const [, opts] = fetchMock.mock.calls[0] as any
    expect(opts.headers.Authorization).toBe('Bearer abc')
    expect(fetchMock.mock.calls[0][0]).toContain('page=1')
  })

  it('omite params undefined/null', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({}))
    await get('/x', { a: undefined, b: null, c: 'v' } as any)
    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('c=v')
    expect(url).not.toContain('a=')
    expect(url).not.toContain('b=')
  })

  it('extrae message string y arrays del body de error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'falló' }, { status: 400 }),
    )
    const r1 = await get('/x')
    expect(r1.ok).toBe(false)
    expect(r1.error).toBe('falló')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: ['a', 'b'] }, { status: 400 }),
    )
    const r2 = await get('/x')
    expect(r2.error).toBe('a. b')
  })

  it('error de red → status 0', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('down'))
    const res = await get('/x')
    expect(res.ok).toBe(false)
    expect(res.status).toBe(0)
    expect(res.error).toBe('down')
  })

  it('401 con refresh válido reintenta la petición', async () => {
    localStorage.setItem('auth_token', 'old')
    localStorage.setItem('refresh_token', 'r1')
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'unauth' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ token: 'new', refreshToken: 'r2' }))
      .mockResolvedValueOnce(jsonResponse({ data: 1 }))
    const res = await get('/projects')
    expect(res.ok).toBe(true)
    expect(localStorage.getItem('auth_token')).toBe('new')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('401 sin refresh → llama al unauthorized handler', async () => {
    localStorage.setItem('auth_token', 'old')
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'x' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const res = await post('/projects', { a: 1 })
    expect(res.ok).toBe(false)
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
