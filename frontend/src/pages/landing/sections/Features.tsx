// ──────────────────────────────────────────────
// Features — qué hace la plataforma, no qué promete.
// Cada tarjeta describe algo que el producto ya hace
// hoy, y las cifras salen del contenido real.
// ──────────────────────────────────────────────

import { Brain, Calculator, FileText, PlayCircle, Route, Spade } from 'lucide-react'
import { useProgramStats, type ProgramStats } from '@features/academy/showcase'
import { Section, SectionHead } from './shared'

function features(PROGRAM_STATS: ProgramStats) {
  return [
    {
      icon: Route,
      title: 'Ruta de aprendizaje guiada',
      description: `${PROGRAM_STATS.levels} niveles, ${PROGRAM_STATS.courses} cursos y ${PROGRAM_STATS.lessons} clases encadenadas: de las reglas básicas a la teoría de juego, sin saltos ni huecos.`,
    },
    {
      icon: Spade,
      title: 'Mesa jugable de 2 a 9',
      description:
        'Texas Hold\'em completo contra rivales con estilos reconocibles. Cambias jugadores, ciegas y dificultad cuando quieras.',
    },
    {
      icon: Brain,
      title: 'Análisis de cada decisión',
      description:
        'Tras cada jugada ves tu equity real, las pot odds que exigía la apuesta y por qué tu decisión fue correcta o mejorable.',
    },
    {
      icon: Calculator,
      title: 'Herramientas de estudio',
      description: `${PROGRAM_STATS.tools} herramientas: calculadora de equity, matriz de rangos preflop y entrenador de manos iniciales con corrección inmediata.`,
    },
    {
      icon: FileText,
      title: 'Biblioteca y glosario',
      description: `${PROGRAM_STATS.articles} artículos por temas y ${PROGRAM_STATS.glossaryTerms} términos de glosario, consultables sin salir de la clase.`,
    },
    {
      icon: PlayCircle,
      title: 'Videotutoriales con capítulos',
      description: `${PROGRAM_STATS.videos} vídeos organizados por nivel, con capítulos navegables e ideas clave resumidas para repasar rápido.`,
    },
  ]
}

export default function Features() {
  const FEATURES = features(useProgramStats())
  return (
    <Section>
      <SectionHead
        eyebrow="Qué incluye"
        title="Todo lo que necesitas para dejar de improvisar"
        subtitle="No es una colección de vídeos sueltos. Es teoría, mesa y corrección en el mismo sitio."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-6 transition-colors duration-300 hover:border-[var(--border-active)]"
          >
            <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-[var(--poker-gold)]/12 text-[var(--poker-gold)]">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">{title}</h3>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  )
}
