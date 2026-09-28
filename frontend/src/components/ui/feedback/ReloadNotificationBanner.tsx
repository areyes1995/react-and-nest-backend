import { useState } from 'react'
import { useReloadNotification } from '@context/ReloadNotificationContext'
import { ArrowRight, X } from 'lucide-react'

export default function ReloadNotificationBanner() {
  const { state, dismissReloadNotification, reloadPage } = useReloadNotification()
  const [dismissed, setDismissed] = useState(false)

  if (!state.visible) return null

  const handleReload = () => {
    reloadPage()
    setDismissed(true)
  }

  const handleClose = () => {
    dismissReloadNotification()
    setDismissed(true)
  }

  const shouldShow = state.visible && !dismissed

  if (!shouldShow) return null

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 backdrop-blur-md px-4 py-2.5 flex items-center justify-center gap-3 text-sm text-amber-200/90 animate-fade-in">
      <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9v-5l-3 4h5.5l-3-5z" />
            </svg>
            Configuration updated — click to reload
          </span>
      <button
        onClick={handleReload}
        className="flex items-center gap-1 px-3 py-1 bg-amber-500/30 hover:bg-amber-500/50 rounded transition text-xs font-medium text-amber-200"
      >
        <ArrowRight className="w-3.5 h-3.5" />
        Reload
      </button>
      <button
        onClick={handleClose}
        className="ml-2 text-amber-300/50 hover:text-amber-200 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
