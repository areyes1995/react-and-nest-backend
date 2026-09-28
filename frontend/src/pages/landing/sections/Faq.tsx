// ──────────────────────────────────────────────
// Faq — las objeciones, respondidas antes de pagar.
// Acordeón nativo (<details>): accesible y navegable
// con teclado sin escribir una línea de estado.
// ──────────────────────────────────────────────

import { ChevronDown } from 'lucide-react'
import { Section, SectionHead } from './shared'

const QUESTIONS = [
  {
    q: '¿Necesito saber jugar para empezar?',
    a: 'No. El nivel Principiante arranca por las reglas, el orden de las manos y la posición. Si nunca has repartido una carta, ese es tu sitio, y sus 3 primeros cursos son gratis.',
  },
  {
    q: '¿Se juega con dinero real?',
    a: 'No. La mesa es de práctica: fichas sin valor, contra rivales del propio programa. Esto es una academia, no una sala de juego.',
  },
  {
    q: '¿Qué pasa si cancelo la suscripción?',
    a: 'Conservas tu cuenta, tu progreso, tu racha y tus logros. Pierdes el acceso al contenido de pago, pero puedes recuperarlo cuando quieras, o comprar accesos únicos solo de lo que uses.',
  },
  {
    q: '¿Cómo funcionan los accesos únicos?',
    a: 'Son pagos sueltos, sin renovación, y se desbloquean en tu cuenta una vez has tenido Premium o Premium Gold. Están pensados para después: cuando no quieres una suscripción entera pero sí seguir usando las herramientas o la mesa.',
  },
  {
    q: '¿Hace falta instalar algo?',
    a: 'Nada. Todo funciona en el navegador, en ordenador y en móvil. Tu progreso se guarda en la cuenta, así que puedes cambiar de dispositivo a mitad de clase.',
  },
  {
    q: '¿Puedo cambiar de plan más adelante?',
    a: 'Sí, en cualquier momento y desde tu propia cuenta. Al subir de plan el contenido nuevo se abre al instante; al bajar, el cambio se aplica cuando termina el periodo que ya pagaste.',
  },
]

export default function Faq() {
  return (
    <Section id="preguntas">
      <SectionHead centered eyebrow="Preguntas" title="Lo que suelen preguntar antes de entrar" />

      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {QUESTIONS.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-5 transition-colors hover:border-[var(--border-active)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[0.9375rem] font-semibold text-[var(--text-primary)] [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="pb-5 pr-8 text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
              {a}
            </p>
          </details>
        ))}
      </div>
    </Section>
  )
}
