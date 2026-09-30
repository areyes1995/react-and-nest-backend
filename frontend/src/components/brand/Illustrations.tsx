// Ilustraciones vectoriales del sistema (robot asistente, pizarra, planta).

export function Robot({ size = 96, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="rb-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ede7fb" />
        </linearGradient>
        <linearGradient id="rb-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f472b6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="112" rx="30" ry="5" fill="#8b5cf6" opacity="0.15" />
      <line x1="60" y1="14" x2="60" y2="24" stroke="#c4b5fd" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="11" r="5" fill="url(#rb-accent)" />
      <rect x="22" y="24" width="76" height="56" rx="26" fill="url(#rb-body)" stroke="#e4dcfa" strokeWidth="2" />
      <rect x="31" y="34" width="58" height="36" rx="18" fill="#2e1065" />
      <ellipse cx="48" cy="52" rx="6" ry="7" fill="#67e8f9" />
      <ellipse cx="72" cy="52" rx="6" ry="7" fill="#67e8f9" />
      <path d="M52 62q8 6 16 0" fill="none" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" />
      <rect x="14" y="42" width="10" height="20" rx="5" fill="url(#rb-accent)" />
      <rect x="96" y="42" width="10" height="20" rx="5" fill="url(#rb-accent)" />
      <rect x="36" y="82" width="48" height="24" rx="12" fill="url(#rb-body)" stroke="#e4dcfa" strokeWidth="2" />
      <circle cx="60" cy="94" r="5" fill="url(#rb-accent)" />
      <path d="M36 88q-12 2-14 12" fill="none" stroke="#e4dcfa" strokeWidth="6" strokeLinecap="round" />
      <path d="M84 88q12-6 16-16" fill="none" stroke="#e4dcfa" strokeWidth="6" strokeLinecap="round" />
      <circle cx="101" cy="70" r="5" fill="#fbcfe8" />
    </svg>
  )
}

export function TeachingIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 130" className={className} aria-hidden="true">
      <rect x="70" y="10" width="120" height="78" rx="8" fill="#ffffff" stroke="#ddd6fe" strokeWidth="3" />
      <polyline points="84,70 104,52 122,60 144,32 170,44" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M166 30l8 10-12 2z" fill="#8b5cf6" />
      <circle cx="104" cy="52" r="4" fill="#ec4899" />
      <circle cx="144" cy="32" r="4" fill="#ec4899" />
      <line x1="84" y1="78" x2="176" y2="78" stroke="#ede9fe" strokeWidth="3" />
      <circle cx="40" cy="30" r="12" fill="#fcd9b6" />
      <path d="M28 26q12-16 24 0" fill="#3f2a56" />
      <rect x="26" y="44" width="28" height="42" rx="12" fill="#ec4899" />
      <path d="M52 52l24-12" stroke="#fcd9b6" strokeWidth="6" strokeLinecap="round" />
      <rect x="30" y="84" width="8" height="30" rx="4" fill="#312e81" />
      <rect x="42" y="84" width="8" height="30" rx="4" fill="#312e81" />
      {[100, 130, 160].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="104" r="9" fill={['#fcd9b6', '#e8b48f', '#f5c7a1'][i]} />
          <path d={`M${x - 13} 128q13-22 26 0`} fill={['#a855f7', '#f472b6', '#60a5fa'][i]} />
        </g>
      ))}
    </svg>
  )
}

export function Plant({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 110" className={className} aria-hidden="true">
      <path d="M40 70C40 45 20 40 14 22c16 2 26 16 26 34" fill="#a855f7" opacity="0.75" />
      <path d="M40 70c0-28 18-36 26-52-16 4-26 20-26 40" fill="#c084fc" />
      <path d="M40 72c-6-16-22-18-30-14 10 8 22 10 30 22" fill="#e879f9" opacity="0.8" />
      <path d="M40 72c8-14 22-16 30-10-10 6-22 8-30 18" fill="#d8b4fe" />
      <path d="M22 78h36l-5 28H27z" fill="#f9a8d4" />
      <rect x="19" y="74" width="42" height="8" rx="4" fill="#f472b6" />
    </svg>
  )
}
