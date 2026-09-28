// ──────────────────────────────────────────────
// Tooltip — Hover tooltip rendered with position:fixed
// so it is never clipped by overflow containers.
// Inherits the `group` class from an ancestor.
// Repositions to stay inside the viewport.
// ──────────────────────────────────────────────

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export interface TooltipProps {
  content: string
  children: ReactNode
  side?: 'right' | 'top'
  delay?: number
  className?: string
}

const pad = 12

export default function Tooltip({ content, children, side = 'right', delay = 400, className = '' }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<number | null>(null)
  const [pos, setPos] = useState<{ x: number; y: number; side: 'right' | 'top' } | null>(null)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const show = () => {
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      const el = triggerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const initial = side === 'right'
        ? { x: rect.right + pad, y: rect.top + rect.height / 2, side: 'right' as const }
        : { x: rect.left + rect.width / 2, y: rect.top - pad, side: 'top' as const }
      setPos(initial)
    }, delay)
  }

  const hide = () => {
    clearTimer()
    setPos(null)
  }

  useLayoutEffect(() => {
    if (!pos || !tipRef.current) return
    const tip = tipRef.current
    const tipRect = tip.getBoundingClientRect()
    const margin = 8
    let x = pos.x
    let y = pos.y

    if (pos.side === 'right') {
      if (x + tipRect.width + margin > window.innerWidth) {
        x = triggerRef.current!.getBoundingClientRect().left - pad - tipRect.width
      }
    } else {
      x = Math.min(Math.max(x, tipRect.width / 2 + margin), window.innerWidth - tipRect.width / 2 - margin)
      if (y - tipRect.height < margin) {
        y = triggerRef.current!.getBoundingClientRect().bottom + pad
      }
    }
    if (x !== pos.x || y !== pos.y) {
      setPos({ ...pos, x, y })
    }
  }, [pos])

  const isVisible = pos !== null

  useLayoutEffect(() => () => clearTimer(), [])

  return (
    <span
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      className={`relative inline-flex ${className}`}
    >
      {children}
      {isVisible && (
        <span
          ref={tipRef}
          role="tooltip"
          className={`pointer-events-none fixed z-50 whitespace-nowrap rounded-lg bg-[var(--bg-panel)] border border-[var(--border-active)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] shadow-xl ${
            pos.side === 'right' ? '-translate-y-1/2' : '-translate-x-1/2'
          }`}
          style={{ left: pos.x, top: pos.y }}
        >
          {content}
        </span>
      )}
    </span>
  )
}