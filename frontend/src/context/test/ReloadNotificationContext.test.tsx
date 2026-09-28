import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import {
  ReloadNotificationProvider,
  useReloadNotification,
} from '@context/ReloadNotificationContext'
import { emitConfigUpdate } from '@services/config-events'

function Probe() {
  const { state, showReloadNotification, dismissReloadNotification } =
    useReloadNotification()
  return (
    <div>
      <span data-testid="visible">{String(state.visible)}</span>
      <button onClick={showReloadNotification}>show</button>
      <button onClick={dismissReloadNotification}>hide</button>
    </div>
  )
}

describe('ReloadNotificationContext', () => {
  it('inicia oculto y alterna con show/dismiss', async () => {
    render(
      <ReloadNotificationProvider>
        <Probe />
      </ReloadNotificationProvider>,
    )
    expect(screen.getByTestId('visible').textContent).toBe('false')
    await act(async () => {
      screen.getByText('show').click()
    })
    expect(screen.getByTestId('visible').textContent).toBe('true')
    await act(async () => {
      screen.getByText('hide').click()
    })
    expect(screen.getByTestId('visible').textContent).toBe('false')
  })

  it('un evento externo de config lo muestra', async () => {
    render(
      <ReloadNotificationProvider>
        <Probe />
      </ReloadNotificationProvider>,
    )
    await act(async () => {
      emitConfigUpdate()
    })
    expect(screen.getByTestId('visible').textContent).toBe('true')
  })

  it('reloadPage llama a window.location.reload', () => {
    const reload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload },
      writable: true,
    })
    function ReloadProbe() {
      const { reloadPage } = useReloadNotification()
      return <button onClick={reloadPage}>reload</button>
    }
    render(
      <ReloadNotificationProvider>
        <ReloadProbe />
      </ReloadNotificationProvider>,
    )
    screen.getByText('reload').click()
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
