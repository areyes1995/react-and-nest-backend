import { describe, it, expect, vi } from 'vitest'
import { onConfigUpdate, emitConfigUpdate } from '@services/config-events'

describe('config-events', () => {
  it('notifica a los suscriptores', () => {
    const cb = vi.fn()
    onConfigUpdate(cb)
    emitConfigUpdate()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('unsubscribe deja de notificar', () => {
    const cb = vi.fn()
    const unsub = onConfigUpdate(cb)
    unsub()
    emitConfigUpdate()
    expect(cb).not.toHaveBeenCalled()
  })

  it('notifica a múltiples listeners', () => {
    const a = vi.fn()
    const b = vi.fn()
    const unA = onConfigUpdate(a)
    const unB = onConfigUpdate(b)
    emitConfigUpdate()
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
    unA()
    unB()
  })
})
