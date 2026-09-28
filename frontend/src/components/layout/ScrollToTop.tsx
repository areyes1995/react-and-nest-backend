// ──────────────────────────────────────────────
// ScrollToTop — al cambiar de página, el cuerpo
// vuelve arriba del todo.
//
// El scroll de la app no está en `window`: cada
// página (`AcademyPage`) gestiona el suyo y React
// Router reutiliza el mismo componente al pasar de
// una clase a otra, así que sin esto la clase nueva
// aparece a la altura donde se quedó la anterior
// (p. ej. abajo del todo en vista completa).
//
// Atrás/adelante del navegador (POP) no se toca:
// el navegador restaura la posición guardada.
// ──────────────────────────────────────────────

import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    if (navType === 'POP') return
    document.querySelectorAll('[data-academy-scroll]').forEach(element => {
      element.scrollTop = 0
    })
  }, [pathname, navType])

  return null
}
