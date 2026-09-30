import type { ReactNode } from 'react'
import { cn } from '@lib/cn'

export type Tone = 'pink' | 'purple' | 'blue' | 'orange' | 'yellow' | 'green' | 'red' | 'sky' | 'gray'

export const TONE_CLASSES: Record<Tone, string> = {
  pink: 'bg-soft-pink text-pink-600 dark:text-pink-300',
  purple: 'bg-soft-purple text-violet-600 dark:text-violet-300',
  blue: 'bg-soft-blue text-blue-600 dark:text-blue-300',
  orange: 'bg-soft-orange text-orange-600 dark:text-orange-300',
  yellow: 'bg-soft-yellow text-amber-600 dark:text-amber-300',
  green: 'bg-soft-green text-emerald-600 dark:text-emerald-300',
  red: 'bg-soft-red text-red-600 dark:text-red-300',
  sky: 'bg-soft-sky text-sky-600 dark:text-sky-300',
  gray: 'bg-surface-3 text-ink-2',
}

export function Badge({ tone = 'gray', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('pill', TONE_CLASSES[tone], className)}>{children}</span>
}

/** Cuadro de icono con fondo pastel (accesos rápidos, tarjetas de módulo). */
export function IconTile({
  tone,
  children,
  size = 'md',
  className,
}: {
  tone: Tone
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const dims = size === 'sm' ? 'h-8 w-8 rounded-lg' : size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-11 w-11 rounded-xl'
  return <span className={cn('grid shrink-0 place-items-center', dims, TONE_CLASSES[tone], className)}>{children}</span>
}
