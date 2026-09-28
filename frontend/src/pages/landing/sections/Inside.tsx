// ──────────────────────────────────────────────
// Inside — la plataforma por dentro.
// Después de la atmósfera y el precio toca la
// prueba: la mesa real dentro de un marco de
// navegador. Lo que se ve aquí es el producto,
// no una ilustración.
// ──────────────────────────────────────────────

import { Suspense, lazy } from 'react'
import { GraduationCap, Spade, Brain, Trophy } from 'lucide-react'
import { Section, SectionHead } from './shared'

// El motor de juego solo se descarga cuando el visitante
// llega hasta aquí; el telón de la portada no lo espera.
const TablePreview = lazy(() => import('./TablePreview'))

const STEPS = [
  { icon: GraduationCap, label: 'Estudia la clase' },
  { icon: Spade, label: 'Practica en la mesa' },
  { icon: Brain, label: 'Revisa el análisis' },
  { icon: Trophy, label: 'Sube de nivel' },
]

export default function Inside() {
  return (
    <div className="border-y border-[var(--border)] bg-[var(--bg-main)]">
      <Section id="plataforma">
        <SectionHead
          centered
          eyebrow="La plataforma"
          title="Esta es la mesa, no un vídeo de la mesa"
          subtitle="Texas Hold'em completo en el navegador, con las mismas piezas que usas en cada clase práctica."
        />

        <div className="flex items-center justify-between gap-3 px-2 pb-3">
          <span className="truncate text-caption font-medium text-[var(--text-muted)]">
            Mesa de práctica · 6 jugadores · ciegas 25/50
          </span>
          <span className="shrink-0 text-caption font-semibold text-[var(--poker-gold)]">
            Modo entrenamiento
          </span>
        </div>

        <div className="px-2 py-4 sm:px-6" aria-hidden="true">
          <Suspense
            fallback={
              <div className="mx-auto h-64 w-full max-w-3xl animate-pulse rounded-[46%/50%] bg-[var(--poker-felt)]/25" />
            }
          >
            <TablePreview />
          </Suspense>
        </div>

        {/* ── El ciclo de aprendizaje ── */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, label }, index) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-4 py-3.5"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--poker-gold)]/12 text-[var(--poker-gold)]">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-mini font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Paso {index + 1}
                </p>
                <p className="truncate text-[0.875rem] font-semibold text-[var(--text-primary)]">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
