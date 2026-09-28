import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('json-config', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  function mockFetchOk(handler: (url: string) => unknown) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation((async (url: any) => {
      return {
        ok: true,
        status: 200,
        json: async () => handler(String(url)),
      } as Response
    }) as any)
  }

  it('filtra _deleted y memoiza', async () => {
    const { jsonConfig } = await import('@services/json-config')
    const fetchMock = mockFetchOk((url: string) => {
      if (url.includes('system-modules'))
        return [{ slug: 'a' }, { slug: 'b', _deleted: true }]
      if (url.includes('custom-modules')) return []
      if (url.includes('settings-schema')) return { module: {} }
      if (url.includes('component-types')) return {}
      return null
    })
    const mods = await jsonConfig.getSystemModules()
    expect(mods).toEqual([{ slug: 'a' }])
    const raw = await jsonConfig.getSystemModulesRaw()
    expect(raw).toHaveLength(2)
    const calls = fetchMock.mock.calls.length
    await jsonConfig.getSystemModules()
    expect(fetchMock.mock.calls.length).toBe(calls)
  })

  it('fetchJson lanza si !ok', async () => {
    const { jsonConfig } = await import('@services/json-config')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 404 } as Response)
    await expect(jsonConfig.getCustomModules()).rejects.toThrow('Failed to load')
  })

  it('update* hace POST, actualiza caché y emite evento', async () => {
    const { jsonConfig } = await import('@services/json-config')
    const { onConfigUpdate } = await import('@services/config-events')
    const cb = vi.fn()
    const unsub = onConfigUpdate(cb)
    try {
      const fetchMock = mockFetchOk(() => ({}))
      await jsonConfig.updateCustomModules([{ slug: 'nuevo' }] as any)
      expect(fetchMock).toHaveBeenCalledWith(
        '/local-config/custom-modules.json',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(cb).toHaveBeenCalledTimes(1)
      // la caché refleja lo guardado (sin _deleted)
      const cached = await jsonConfig.getCustomModules()
      expect(cached).toEqual([{ slug: 'nuevo' }])
    } finally {
      unsub()
    }
  })

  it('update lanza si el POST falla', async () => {
    const { jsonConfig } = await import('@services/json-config')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 500 } as Response)
    await expect(jsonConfig.updateSystemModules([])).rejects.toThrow('Failed to update')
  })
})
