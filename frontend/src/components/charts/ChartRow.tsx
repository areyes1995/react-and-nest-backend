import type { ReactNode } from 'react'

interface ChartRowProps {
  left: ReactNode
  right: ReactNode
}

export default function ChartRow({ left, right }: ChartRowProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {left}
      {right}
    </div>
  )
}
