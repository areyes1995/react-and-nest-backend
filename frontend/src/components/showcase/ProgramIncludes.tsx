// ──────────────────────────────────────────────
// ProgramIncludes — "Este programa incluye", al
// estilo Udemy. Las cifras salen del contenido real
// (ver features/academy/showcase.ts).
// ──────────────────────────────────────────────

import { BookOpen, Calculator, CircleHelp, FileText, Globe, Headphones, MonitorPlay, Spade, Swords, Users } from 'lucide-react'
import { COMMUNITY, formatDuration, useProgramStats } from '@features/academy/showcase'

export default function ProgramIncludes({ title = 'Este programa incluye' }: { title?: string }) {
  const s = useProgramStats()
  const rows = [
    { icon: MonitorPlay, text: `${formatDuration(s.minutes)} de clases en ${s.lessons} lecciones` },
    { icon: Spade, text: `${s.drills} prácticas guiadas en una mesa real de 2 a 9 jugadores` },
    { icon: CircleHelp, text: `${s.quizzes} tests con la explicación de cada respuesta` },
    { icon: Swords, text: `${s.spots} situaciones de mano resueltas paso a paso` },
    { icon: Calculator, text: `${s.tools} herramientas: equity, rangos preflop y entrenador` },
    { icon: FileText, text: `${s.articles} artículos y ${s.videos} videos con capítulos` },
    { icon: BookOpen, text: `Glosario con ${s.glossaryTerms} términos de la mesa` },
    { icon: Headphones, text: 'Clases con lectura en voz alta en español latino' },
    { icon: Globe, text: 'En el navegador, a tu ritmo y sin descargas' },
  ]

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5 sm:p-6">
      <h2 className="text-lg font-extrabold text-[var(--text-primary)]">{title}</h2>
      {COMMUNITY.learners !== null && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
          <Users className="w-4 h-4" strokeWidth={2} />
          {COMMUNITY.learners.toLocaleString('es')} estudiantes
          {COMMUNITY.rating !== null && ` · ★ ${COMMUNITY.rating.toFixed(1)}`}
          {COMMUNITY.reviews !== null && ` (${COMMUNITY.reviews.toLocaleString('es')} valoraciones)`}
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {rows.map(row => (
          <li key={row.text} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
            <row.icon className="mt-0.5 w-4 h-4 text-[var(--text-primary)] shrink-0" strokeWidth={2} />
            {row.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
