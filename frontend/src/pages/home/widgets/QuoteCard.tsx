import { Plant } from '@components/brand/Illustrations'

const QUOTES = [
  { text: 'La educación no cambia el mundo, cambia a las personas que van a cambiar el mundo.', author: 'Paulo Freire' },
  { text: 'Enseñar es aprender dos veces.', author: 'Joseph Joubert' },
  { text: 'Las matemáticas son la música de la razón.', author: 'James Joseph Sylvester' },
  { text: 'Educar la mente sin educar el corazón no es educación en absoluto.', author: 'Aristóteles' },
]

export function QuoteCard({ seed }: { seed: string }) {
  const q = QUOTES[Number(seed.replace(/\D/g, '')) % QUOTES.length]
  return (
    <section className="card relative overflow-hidden p-5">
      <span className="absolute left-3 top-1 text-5xl font-black text-violet-200 dark:text-violet-900">“</span>
      <p className="relative max-w-[70%] pt-4 text-sm font-semibold leading-relaxed text-ink">{q.text}</p>
      <p className="mt-2 text-xs text-ink-3">— {q.author}</p>
      <Plant className="absolute -bottom-1 right-3 h-24" />
    </section>
  )
}
