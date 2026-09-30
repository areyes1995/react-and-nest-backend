import type { ReactNode } from 'react'
import { BarChart3, Bot, ClipboardCheck, LayoutList } from 'lucide-react'
import { Logo } from '@components/brand/Logo'
import { Robot, TeachingIllustration } from '@components/brand/Illustrations'

const FEATURES = [
  { icon: <LayoutList className="h-4 w-4" />, text: 'Planificación alineada a la Adecuación Curricular MINERD' },
  { icon: <ClipboardCheck className="h-4 w-4" />, text: 'Evaluación, rúbricas y registro oficial de calificaciones' },
  { icon: <BarChart3 className="h-4 w-4" />, text: 'Seguimiento, alertas y reportes para las familias' },
  { icon: <Bot className="h-4 w-4" />, text: 'IA pedagógica: sesiones, problemas y tutor virtual' },
]

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="frame flex min-h-dvh items-center justify-center p-3 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-line bg-surface shadow-pop lg:grid-cols-[1.05fr_1fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-pink-100 via-fuchsia-50 to-violet-100 p-10 dark:from-pink-950/40 dark:via-fuchsia-950/30 dark:to-violet-950/40 lg:flex">
          <div>
            <Logo className="items-start" />
            <h2 className="mt-8 text-3xl font-extrabold leading-tight text-violet-950 dark:text-violet-50">
              Este es tu espacio para <span className="text-brand-pink">enseñar</span>, <span className="text-brand-purple">inspirar</span> y{' '}
              <span className="text-gradient">transformar</span> vidas.
            </h2>
            <ul className="mt-6 space-y-3">
              {FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm font-medium text-violet-900 dark:text-violet-100">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/80 text-brand-purple shadow-sm dark:bg-white/10">{f.icon}</span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mt-8 h-40">
            <TeachingIllustration className="absolute bottom-0 left-0 h-40" />
            <Robot size={96} className="absolute bottom-0 right-0" />
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-3">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </div>
  )
}
