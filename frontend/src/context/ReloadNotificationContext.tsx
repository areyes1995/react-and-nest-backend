import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { onConfigUpdate } from '@services/config-events'

interface ReloadNotificationState {
  visible: boolean
}

interface ReloadNotificationContextValue {
  state: ReloadNotificationState
  showReloadNotification: () => void
  dismissReloadNotification: () => void
  reloadPage: () => void
}

const ReloadNotificationContext = createContext<ReloadNotificationContextValue>({
  state: { visible: false },
  showReloadNotification: () => {},
  dismissReloadNotification: () => {},
  reloadPage: () => {},
})

export function ReloadNotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ReloadNotificationState>({ visible: false })

  const showReloadNotification = useCallback(() => {
    setState({ visible: true })
  }, [])

  const dismissReloadNotification = useCallback(() => {
    setState({ visible: false })
  }, [])

  const reloadPage = useCallback(() => {
    window.location.reload()
  }, [])

  useEffect(() => {
    const unsub = onConfigUpdate(showReloadNotification)
    return unsub
  }, [])

  return (
    <ReloadNotificationContext.Provider value={{ state, showReloadNotification, dismissReloadNotification, reloadPage }}>
      {children}
    </ReloadNotificationContext.Provider>
  )
}

export const useReloadNotification = () => useContext(ReloadNotificationContext)
