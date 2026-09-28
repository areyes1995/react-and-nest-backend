// ──────────────────────────────────────────────
// LandingFooter — cierre de la portada.
// Incluye el aviso de juego responsable: la
// plataforma enseña póker, y decirlo claro es
// parte de hacerlo bien.
// ──────────────────────────────────────────────

import { Link } from 'react-router-dom'
import { BrandMark } from './shared'

const COLUMNS = [
  {
    title: 'Programa',
    links: [
      { label: 'El programa', href: '#programa' },
      { label: 'La plataforma', href: '#plataforma' },
      { label: 'Herramientas', href: '#solver' },
      { label: 'Comparativa', href: '#comparativa' },
    ],
  },
  {
    title: 'Planes',
    links: [
      { label: 'Suscripciones', href: '#planes' },
      { label: 'Accesos únicos', href: '#accesos' },
      { label: 'Opiniones', href: '#opiniones' },
      { label: 'Preguntas', href: '#preguntas' },
    ],
  },
]

export default function LandingFooter() {
  return (
    <footer className="px-5 py-14 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Link to="/" className="flex items-center gap-2.5">
              <BrandMark size={28} />
              <span className="text-[0.9375rem] font-bold tracking-tight text-[var(--text-primary)]">
                Poker Academy
              </span>
            </Link>
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
              Texas Hold'em explicado desde las reglas hasta la teoría de juego, con mesa de
              práctica y análisis de cada decisión.
            </p>
          </div>

          <div className="flex gap-12 sm:gap-20">
            {COLUMNS.map(column => (
              <div key={column.title}>
                <h3 className="mb-3 text-[0.8125rem] font-bold text-[var(--text-primary)]">
                  {column.title}
                </h3>
                <ul className="flex flex-col gap-2">
                  {column.links.map(link => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="text-[0.8125rem] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="mb-3 text-[0.8125rem] font-bold text-[var(--text-primary)]">Cuenta</h3>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    to="/login"
                    className="text-[0.8125rem] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
                  >
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link
                    to="/forgot-password"
                    className="text-[0.8125rem] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
                  >
                    Recuperar contraseña
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} Poker Academy. Todos los derechos reservados.
          </p>
          <p className="max-w-md text-xs leading-relaxed text-[var(--text-muted)]">
            Plataforma educativa. No se juega con dinero real ni se ofrecen apuestas. Si el juego
            deja de ser un pasatiempo para ti, busca ayuda profesional.
          </p>
        </div>
      </div>
    </footer>
  )
}
