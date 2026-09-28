import type { CSSProperties, ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: string
  maxHeight?: string
}

export default function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
  maxHeight = 'max-h-[90vh]',
}: ModalProps) {
  if (!isOpen) return null

  const modalStyle: CSSProperties = {
    animation: 'fade-in 0.2s ease-out',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={modalStyle}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-[var(--bg-panel)] border border-[var(--border)] rounded-xl shadow-2xl w-full mx-4 overflow-y-auto animate-slide-up ${maxWidth} ${maxHeight}`}
      >
        {children}
      </div>
    </div>
  )
}
