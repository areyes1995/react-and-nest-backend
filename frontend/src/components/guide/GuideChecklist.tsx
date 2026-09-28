// ──────────────────────────────────────────────
// GuideChecklist — "primeros pasos" del panel.
//
// La versión extendida del itinerario, para la
// portada del estudiante: cada etapa con su porqué
// y su botón. Cuando el onboarding termina la
// tarjeta se retira sola — una lista de tareas ya
// hechas solo ocupa sitio.
// ──────────────────────────────────────────────

import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, Compass } from 'lucide-react'
import { Icon, ProgressBar } from '@components/content'
import { useGuide } from '@features/guide'
import type { JourneyStage } from '@features/guide'

export default function GuideChecklist() {
  const { journey, state, setChecklistCollapsed, startTour } = useGuide()
  const navigate = useNavigate()

  // Terminado el onboarding, la franja superior basta: esta tarjeta desaparece.
  if (journey.onboardingDone) return null

  const collapsed = state.checklistCollapsed
  const steps = journey.stages.filter(stage => stage.id !== 'keep-going')
  const done = steps.filter(stage => stage.done).length

  const act = (stage: JourneyStage) => {
    if (stage.opensTour) startTour()
    else if (stage.to) navigate(stage.to)
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] overflow-hidden">
      <button
        type="button"
        onClick={() => setChecklistCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-surface-soft)] transition"
      >
        <span
          className="grid place-items-center w-8 h-8 rounded-lg shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--poker-gold) 14%, transparent)',
            color: 'var(--poker-gold)',
          }}
        >
          <Compass className="w-4 h-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Primeros pasos</h2>
          <p className="text-caption text-[var(--text-muted)]">
            {done} de {steps.length} completados · te lleva unos 20 minutos
          </p>
        </div>
        <div className="hidden sm:block w-28 shrink-0">
          <ProgressBar value={steps.length === 0 ? 0 : done / steps.length} />
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
            collapsed ? '' : 'rotate-180'
          }`}
          strokeWidth={2}
        />
      </button>

      {!collapsed && (
        <ol className="px-3 pb-3 space-y-1">
          {steps.map((stage, index) => {
            const isCurrent = stage.id === journey.current.id
            return (
              <li
                key={stage.id}
                className={`flex items-start gap-3 rounded-xl px-3 py-3 transition-colors ${
                  isCurrent
                    ? 'border border-[var(--poker-gold)]/30 bg-[var(--poker-gold)]/[0.05]'
                    : 'border border-transparent'
                }`}
              >
                <span className="shrink-0 mt-0.5">
                  {stage.done ? (
                    <span className="grid place-items-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </span>
                  ) : (
                    <span
                      className={`grid place-items-center w-6 h-6 rounded-full text-caption font-bold ${
                        isCurrent ? 'text-black' : 'text-[var(--text-muted)] bg-[var(--bg-surface)]'
                      }`}
                      style={isCurrent ? { background: 'var(--poker-gold)' } : undefined}
                    >
                      {index + 1}
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[0.8125rem] font-semibold leading-tight flex items-center gap-1.5 ${
                      stage.done ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon name={stage.icon} className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                    {stage.title}
                  </p>
                  {!stage.done && (
                    <>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 leading-snug">
                        {stage.action}
                      </p>
                      <p className="text-caption text-[var(--text-muted)] mt-1 leading-snug">
                        {stage.why}
                      </p>
                    </>
                  )}
                </div>

                {!stage.done && (
                  <button
                    type="button"
                    onClick={() => act(stage)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-semibold transition ${
                      isCurrent
                        ? 'text-black hover:brightness-110'
                        : 'text-[var(--text-secondary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                    style={isCurrent ? { background: 'var(--poker-gold)' } : undefined}
                  >
                    {stage.cta}
                    <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
