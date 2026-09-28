import type { ReactNode } from 'react'

interface ModalFooterProps {
  left?: ReactNode
  right?: ReactNode
}

export default function ModalFooter({ left, right }: ModalFooterProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-[var(--border)]">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  )
}
