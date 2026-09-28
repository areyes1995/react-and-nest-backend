// ──────────────────────────────────────────────
// Hero — el telón de la portada.
// Patrón de las portadas de streaming: atmósfera a
// pantalla completa, un titular grande, una sola
// acción dominante y el precio a la vista desde el
// primer scroll. Nada de capturas todavía: eso
// llega en "La plataforma por dentro".
// ──────────────────────────────────────────────

import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, PlayCircle } from 'lucide-react'
import { formatDuration, useProgramStats } from '@features/academy/showcase'
import { PLANS, CURRENCY_SYMBOL, formatPrice } from '@features/pricing/plans'

/** Cartas abiertas en abanico: la imagen de marca, dibujada con CSS. */
const FAN = [
  { rank: 'A', suit: '♠', red: false, rotate: -18, x: -224, y: 34 },
  { rank: 'K', suit: '♥', red: true, rotate: -9, x: -112, y: 9 },
  { rank: 'Q', suit: '♠', red: false, rotate: 0, x: 0, y: 0 },
  { rank: 'J', suit: '♦', red: true, rotate: 9, x: 112, y: 9 },
  { rank: '10', suit: '♣', red: false, rotate: 18, x: 224, y: 34 },
]

export default function Hero() {
  const PROGRAM_STATS = useProgramStats()
  const premium = PLANS.find(plan => plan.id === 'premium')!

  return (
    <header className="landing-curtain landing-vignette relative flex min-h-[100svh] items-center overflow-hidden px-5 pb-24 pt-28 sm:px-8">
      <div className="landing-grid pointer-events-none absolute inset-0" />

      {/* Resplandor que respira: mantiene vivo el telón sin distraer. */}
      <div
        aria-hidden="true"
        className="hero-breathe pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 45% 40% at 50% 38%, color-mix(in srgb, var(--poker-gold) 13%, transparent), transparent 70%)',
        }}
      />

      {/* ── Abanico de cartas, detrás del titular ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[30%] hidden -translate-x-1/2 opacity-[0.09] md:block"
      >
        <div className="relative h-72 w-[34rem]">
          {FAN.map((card, index) => (
            <span
              key={card.rank + card.suit}
              className="hero-card absolute left-1/2 top-0 flex h-64 w-44 flex-col justify-between rounded-2xl border border-white/25 bg-white/[0.07] p-4 backdrop-blur-sm"
              style={
                {
                  '--fan-x': `${card.x}px`,
                  '--fan-y': `${card.y}px`,
                  '--fan-rotate': `${card.rotate}deg`,
                  // Se reparten de izquierda a derecha, como en la mesa.
                  animationDelay: `${index * 110}ms`,
                } as CSSProperties
              }
            >
              <span
                className={`text-3xl font-bold leading-none ${
                  card.red ? 'text-[#e2607a]' : 'text-white'
                }`}
              >
                {card.rank}
                <br />
                {card.suit}
              </span>
              <span
                className={`self-end text-3xl font-bold leading-none ${
                  card.red ? 'text-[#e2607a]' : 'text-white'
                }`}
                style={{ transform: 'rotate(180deg)' }}
              >
                {card.rank}
                <br />
                {card.suit}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="relative z-[1] mx-auto w-full max-w-4xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-active)] bg-[var(--bg-panel-80)] px-4 py-1.5 text-xs font-semibold text-[var(--text-secondary)] backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--poker-gold)]" />
          {PROGRAM_STATS.levels} niveles · {PROGRAM_STATS.courses} cursos ·{' '}
          {PROGRAM_STATS.lessons} clases
        </span>

        <h1 className="landing-display mt-7 text-[var(--text-primary)]">
          Deja de jugar
          <br />
          <span className="hero-sheen bg-gradient-to-r from-[var(--poker-gold)] via-[#fff1d6] to-[var(--poker-gold)] bg-clip-text text-transparent">
            por intuición
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-[var(--text-secondary)] sm:text-lg">
          Una academia de Texas Hold'em con mesa jugable y análisis de cada decisión. Estudias la
          clase, la llevas a la mesa y ves por qué acertaste o fallaste.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/login"
            className="press inline-flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-[0.9375rem] font-bold text-[#1a1206] shadow-[0_10px_34px_rgba(242,169,59,0.32)] transition-all hover:brightness-105 sm:w-auto"
            style={{
              background: 'linear-gradient(135deg, var(--poker-gold), #e09a2e)',
            }}
          >
            Empezar gratis
            <ArrowRight className="h-4 w-4" />
          </Link>

          <a
            href="#plataforma"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-active)] bg-[var(--bg-surface)]/60 px-7 py-3.5 text-[0.9375rem] font-semibold text-[var(--text-primary)] backdrop-blur transition-colors hover:bg-[var(--bg-surface-hover)] sm:w-auto"
          >
            <PlayCircle className="h-4 w-4" />
            Ver la plataforma
          </a>
        </div>

        <p className="mt-6 text-[0.8125rem] text-[var(--text-muted)]">
          Los 3 primeros cursos de Fundamentos son gratis, sin tarjeta. Premium desde{' '}
          <strong className="font-semibold text-[var(--text-secondary)]">
            {CURRENCY_SYMBOL}
            {formatPrice(premium.price.annual)}/mes
          </strong>{' '}
          · {formatDuration(PROGRAM_STATS.minutes)} de clase
        </p>
      </div>
    </header>
  )
}
