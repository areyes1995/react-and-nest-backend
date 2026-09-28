// ──────────────────────────────────────────────
// NextStepBar — la franja del siguiente paso.
//
// Vive bajo la barra de actividades, en todas las
// páginas, y muestra una sola cosa: qué toca ahora
// y el botón para hacerlo. Es la red de seguridad
// de la plataforma — da igual dónde se haya metido
// el estudiante, desde aquí vuelve al camino.
//
// Al desplegarla se ve el itinerario entero, con lo
// hecho y lo que queda: el "paso a paso" completo
// sin salir de la página.
// ──────────────────────────────────────────────

import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, Circle, Sparkles } from 'lucide-react'
// Import directo, no por el barril: '../content' reexporta ContentBlocks,
// que arrastra el motor de poker al chunk inicial de toda la web.
import Icon from '@components/content/Icon'
import { useGuide } from '@features/guide'
import type { JourneyStage } from '@features/guide'
import { useAppTranslation } from '@i18n/useAppTranslation'

/** Una etapa dentro del itinerario desplegado. */
function StageRow({
  stage,
  index,
  isCurrent,
  onAct,
}: {
  stage: JourneyStage
  index: number
  isCurrent: boolean
  onAct: (stage: JourneyStage) => void
}) {
  return (
    <li
      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        isCurrent ? 'bg-[var(--bg-surface)]' : ''
      }`}
    >
      <span className="shrink-0 mt-0.5">
        {stage.done ? (
          <span className="grid place-items-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400">
            <Check className="w-3 h-3" strokeWidth={3} />
          </span>
        ) : isCurrent ? (
          <span
            className="grid place-items-center w-5 h-5 rounded-full text-black text-mini font-bold"
            style={{ background: 'var(--poker-gold)' }}
          >
            {index + 1}
          </span>
        ) : (
          <span className="grid place-items-center w-5 h-5 rounded-full text-[var(--text-muted)]">
            <Circle className="w-3.5 h-3.5" strokeWidth={1.5} />
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={`text-[0.8125rem] font-semibold leading-tight ${
            stage.done
              ? 'text-[var(--text-muted)] line-through decoration-1'
              : 'text-[var(--text-primary)]'
          }`}
        >
          {stage.title}
        </p>
        {!stage.done && (
          <>
            <p className="text-caption text-[var(--text-secondary)] mt-0.5 leading-snug">
              {stage.action}
            </p>
            {isCurrent && (
              <p className="text-caption text-[var(--text-muted)] mt-1 leading-snug italic">
                {stage.why}
              </p>
            )}
          </>
        )}
      </div>

      {isCurrent && (
        <button
          type="button"
          onClick={() => onAct(stage)}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-caption font-bold text-black transition hover:brightness-110"
          style={{ background: 'var(--poker-gold)' }}
        >
          {stage.cta}
          <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
        </button>
      )}
    </li>
  )
}

export interface NextStepBarProps {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

export default function NextStepBar({ expanded, onExpandedChange }: NextStepBarProps) {
  const { journey, startTour } = useGuide()
  const navigate = useNavigate()
  const { t } = useAppTranslation()

  const { current, position, total, completed, onboardingDone } = journey
  const ratio = total > 1 ? completed / (total - 1) : 0

  /** Una etapa se resuelve navegando, salvo la del recorrido, que abre el tour. */
  const act = (stage: JourneyStage) => {
    if (stage.opensTour) startTour()
    else if (stage.to) navigate(stage.to)
  }

  return (
    <div data-tour="nextstep" className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-main)]">
      <div className="flex items-center gap-3 px-4 lg:px-6 py-2">
        <span
          className="grid place-items-center w-7 h-7 rounded-lg shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--poker-gold) 14%, transparent)',
            color: 'var(--poker-gold)',
          }}
        >
          <Icon name={current.icon} className="w-3.5 h-3.5" strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-mini uppercase tracking-wide text-[var(--poker-gold)] font-semibold">
            {onboardingDone ? (
              <>
                <Sparkles className="w-3 h-3" strokeWidth={2} />
                {t('guide.onTrack')}
              </>
            ) : (
              <>
                {t('guide.step')} {position} {t('guide.of')} {total}
              </>
            )}
          </p>
          <p className="text-[0.8125rem] text-[var(--text-primary)] font-medium truncate">
            {current.action}
          </p>
        </div>

        <button
          type="button"
          onClick={() => act(current)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black transition hover:brightness-110"
          style={{ background: 'var(--poker-gold)' }}
        >
          <span className="hidden sm:inline">{current.cta}</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          aria-expanded={expanded}
          title={t('guide.seeAllSteps')}
          className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-caption text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition"
        >
          <span className="hidden md:inline tabular-nums">
            {completed}/{total - 1}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Barra de avance del itinerario: fina, sin rótulo, siempre presente. */}
      <div className="h-[2px] bg-[var(--bg-surface)]">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${Math.round(ratio * 100)}%`, background: 'var(--poker-gold)' }}
        />
      </div>

      {expanded && (
        <div className="px-3 lg:px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-panel)]">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <p className="text-caption uppercase tracking-wide text-[var(--text-muted)] font-semibold">
              {t('guide.yourItinerary')}
            </p>
            <Link
              to="/app/learn"
              className="text-caption text-[var(--poker-gold)] hover:underline flex items-center gap-1"
            >
              {t('guide.fullPath')}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ol className="space-y-0.5 max-h-[46vh] overflow-y-auto">
            {journey.stages.map((stage, index) => (
              <StageRow
                key={stage.id}
                stage={stage}
                index={index}
                isCurrent={stage.id === current.id}
                onAct={act}
              />
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
