import { type ReactNode } from 'react'

interface ModalBodyProps {
  children: ReactNode
}

export default function ModalBody({ children }: ModalBodyProps) {
  return <div className="px-6 py-5">{children}</div>
}
