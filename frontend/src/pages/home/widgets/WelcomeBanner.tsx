import { Plant, TeachingIllustration } from '@components/brand/Illustrations'
import { LogoMark } from '@components/brand/Logo'

export function WelcomeBanner({ title, name }: { title?: string | null; name: string }) {
  return (
    <section className="card relative overflow-hidden bg-gradient-to-r from-white via-pink-50/60 to-violet-50 px-5 py-5 dark:from-surface dark:via-pink-950/20 dark:to-violet-950/30 sm:px-6">
      <div className="flex items-center gap-4">
        <TeachingIllustration className="hidden h-28 shrink-0 sm:block" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold text-violet-950 dark:text-violet-50 sm:text-2xl">
            ¡Bienvenido de vuelta, {title ?? 'Profesor'} {name}!
          </h1>
          <p className="mt-1 text-sm font-medium text-ink-2 sm:text-base">
            Este es tu espacio para <span className="font-bold text-brand-pink">enseñar</span>, <span className="font-bold text-brand-purple">inspirar</span> y{' '}
            <span className="font-bold text-brand-pink">transformar</span> vidas.
          </p>
        </div>
        <div className="relative hidden h-24 w-28 shrink-0 md:block">
          <div className="absolute bottom-1 left-0 grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-card dark:bg-surface-3">
            <LogoMark size={36} />
          </div>
          <Plant className="absolute bottom-0 right-0 h-24" />
        </div>
      </div>
    </section>
  )
}
