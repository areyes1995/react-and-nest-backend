// ──────────────────────────────────────────────
// LandingPage — la portada pública de la academia.
//
// Sigue el guion de las portadas de suscripción
// (HBO Max, Disney+): telón cinematográfico, precio
// arriba del todo, catálogo, prueba de producto,
// comparativa, objeciones y cierre.
//
// Siempre oscura: .landing-dark fija los tokens sin
// depender del tema que tenga el usuario.
// ──────────────────────────────────────────────

import { useEffect } from 'react'
import LandingNav from './sections/LandingNav'
import Hero from './sections/Hero'
import Plans from './sections/Plans'
import Levels from './sections/Levels'
import Features from './sections/Features'
import Inside from './sections/Inside'
import Solver from './sections/Solver'
import Testimonials from './sections/Testimonials'
import Packs from './sections/Packs'
import Compare from './sections/Compare'
import Faq from './sections/Faq'
import FinalCta from './sections/FinalCta'
import LandingFooter from './sections/LandingFooter'

/**
 * Revela cada bloque cuando entra en pantalla.
 * Se mide con getBoundingClientRect en lugar de
 * IntersectionObserver: este último no dispara en
 * pestañas en segundo plano y dejaría la portada en
 * blanco para quien abre el enlace en una pestaña nueva.
 */
function useScrollReveal() {
  useEffect(() => {
    const pending = new Set(document.querySelectorAll<HTMLElement>('.landing-reveal'))

    const reveal = () => {
      const limit = window.innerHeight - 40
      for (const node of pending) {
        if (node.getBoundingClientRect().top < limit) {
          node.classList.add('is-visible')
          pending.delete(node)
        }
      }
      if (pending.size === 0) {
        window.removeEventListener('scroll', reveal)
        window.removeEventListener('resize', reveal)
      }
    }

    reveal()
    window.addEventListener('scroll', reveal, { passive: true })
    window.addEventListener('resize', reveal)
    return () => {
      window.removeEventListener('scroll', reveal)
      window.removeEventListener('resize', reveal)
    }
  }, [])
}

export default function LandingPage() {
  useScrollReveal()

  return (
    <div className="landing-dark min-h-dvh scroll-smooth font-sans antialiased">
      <LandingNav />

      <main>
        <Hero />
        <Plans />
        <Levels />
        <Features />
        <Inside />
        <Solver />
        <Packs />
        <Compare />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>

      <LandingFooter />
    </div>
  )
}
