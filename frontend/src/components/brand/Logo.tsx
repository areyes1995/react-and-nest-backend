import { cn } from '@lib/cn'

/** Monograma "CW" con birrete (identidad Craft Wise / Educraft XYZ). */
export function LogoMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lg-cw" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f472b6" />
          <stop offset="0.55" stopColor="#c026d3" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <path d="M44 16.5A21 21 0 1 0 44 47.5" fill="none" stroke="url(#lg-cw)" strokeWidth="7" strokeLinecap="round" />
      <path d="M22 27l6 17 6-12 6 12 6-17" fill="none" stroke="url(#lg-cw)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 6l13 5-13 5-13-5z" fill="#6d28d9" />
      <path d="M50 12v7" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
      <circle cx="50" cy="20.5" r="2" fill="#ec4899" />
      <circle cx="12" cy="44" r="2.5" fill="#f472b6" />
      <circle cx="54" cy="36" r="2" fill="#a855f7" />
    </svg>
  )
}

export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <LogoMark size={compact ? 36 : 56} />
      {!compact && (
        <>
          <span className="mt-1 text-[1.05rem] font-extrabold tracking-[0.18em] text-violet-900 dark:text-violet-200">
            EDU<span className="text-gradient">CRAFT</span>
          </span>
          <span className="flex items-center gap-1.5 text-[0.6rem] font-bold tracking-[0.3em] text-brand-pink">
            <span className="h-px w-4 bg-brand-pink/50" />
            XYZ
            <span className="h-px w-4 bg-brand-pink/50" />
          </span>
        </>
      )}
    </div>
  )
}
