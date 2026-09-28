// ──────────────────────────────────────────────
// AcademyPage — armazón común de las páginas.
// Cabecera fija + cuerpo con scroll propio: el
// contenedor principal no hace scroll, así que cada
// página gestiona el suyo y la cabecera nunca se va.
//
// Con `fill`, el cuerpo NO hace scroll y el contenido
// recibe toda la altura: lo usan las páginas que
// tienen su propia lista con scroll interno (glosario,
// administración de contenido). Es lo que evita las
// dos barras de scroll anidadas.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'

export interface AcademyPageProps {
  title: string
  subtitle?: string
  /** Controles alineados a la derecha de la cabecera. */
  actions?: ReactNode
  children: ReactNode
  /** Ancho máximo del contenido; `prose` para lectura larga. */
  width?: 'full' | 'prose'
  /** El contenido ocupa toda la altura y gestiona su propio scroll. */
  fill?: boolean
  /** Desactiva el margen interior cuando el contenido ya trae el suyo. */
  padded?: boolean
}

export default function AcademyPage({
  title,
  subtitle,
  actions,
  children,
  width = 'full',
  fill = false,
  padded = true,
}: AcademyPageProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="px-4 lg:px-6 py-3 border-b border-[var(--border)] flex items-center gap-4 shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-[var(--text-primary)] truncate">{title}</h1>
          {subtitle && <p className="text-xs text-[var(--text-muted)] truncate">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </header>

      <div
        data-academy-scroll
        className={`flex-1 min-h-0 ${fill ? 'flex flex-col' : 'overflow-y-auto'}`}
      >
        <div
          className={`${padded ? 'px-4 py-5 lg:px-6' : ''} ${
            width === 'prose' ? 'max-w-3xl mx-auto' : ''
          } ${fill ? 'flex flex-1 min-h-0 flex-col' : ''}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
