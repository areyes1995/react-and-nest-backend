// ──────────────────────────────────────────────
// LandingNav — barra superior de la portada.
// Mínima a propósito: en las portadas de streaming
// la navegación no compite con el titular, solo
// deja a mano la marca y la puerta de entrada.
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { BrandMark } from './shared'

const LINKS = [
  { href: '#planes', label: 'Planes' },
  { href: '#programa', label: 'El programa' },
  { href: '#plataforma', label: 'La plataforma' },
  { href: '#opiniones', label: 'Opiniones' },
  { href: '#preguntas', label: 'Preguntas' },
]

export default function LandingNav() {
  const { isAuthenticated } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? 'border-b border-[var(--border)] bg-[var(--bg-app)]/85 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandMark size={30} />
          <span className="whitespace-nowrap text-[0.9375rem] font-bold tracking-tight text-[var(--text-primary)]">
            Poker Academy
          </span>
        </Link>

        <div className="ml-auto hidden items-center gap-6 lg:flex xl:gap-7">
          {LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-[0.8125rem] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <Link
          to={isAuthenticated ? '/app' : '/login'}
          className="ml-auto whitespace-nowrap rounded-lg border border-[var(--border-active)] bg-[var(--bg-surface)] px-4 py-2 text-[0.8125rem] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface-hover)] lg:ml-0"
        >
          {isAuthenticated ? 'Ir a la academia' : 'Iniciar sesión'}
        </Link>
      </div>
    </nav>
  )
}
