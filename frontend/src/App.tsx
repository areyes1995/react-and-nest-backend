// ──────────────────────────────────────────────
// App — Application root
// ──────────────────────────────────────────────

import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@context/AuthContext'
import { ThemeProvider } from '@context/ThemeContext'
import { ProgressProvider } from '@features/progress/ProgressContext'
import { CurriculumProvider } from '@features/academy/CurriculumContext'
import { AcademyContentProvider } from '@features/academy/ContentContext'
import { SavedProvider } from '@features/saved'
import { TableThemeProvider } from '@features/table/TableThemeContext'
import { TableDisplayProvider } from '@features/table/TableDisplayContext'
import { AccessProvider } from '@features/access/AccessContext'
import { router } from '@routes'
import { useContentLanguage } from '@services/translate'
import { setPageLanguage } from '@i18n/PageTranslator'
import './i18n'

/**
 * Traduce en pantalla los textos de la interfaz que no pasan por i18next
 * (ver `i18n/PageTranslator.ts`). Sigue al idioma elegido en Ajustes.
 */
function PageTranslation() {
  const lang = useContentLanguage()
  useEffect(() => setPageLanguage(lang), [lang])
  return null
}

export default function App() {
  return (
    <ThemeProvider>
      <PageTranslation />
      <AuthProvider>
        {/* El currículo viene del backend: con sesión, completo; sin ella, el
            catálogo público que pinta la landing. */}
        <CurriculumProvider>
          {/* Suscripción y reglas de lo gratis: qué cursos y herramientas se
              abren. Necesita el currículo para saber qué cursos son gratis. */}
          <AccessProvider>
          {/* El progreso del estudiante (XP, racha, clases) es global: lo consume
              tanto la barra lateral como las páginas de la academia. */}
          <ProgressProvider>
            {/* Publicación de clases y videos: lo decide el administrador y lo
                leen tanto las clases como el panel de gestión. */}
            <AcademyContentProvider>
              {/* Los guardados del estudiante: los leen las fichas de contenido
                  (para encender el marcador) y la página de la biblioteca. */}
              <SavedProvider>
                {/* Estilo de la mesa (el de todos lo fija un administrador; cada
                    usuario puede elegir el suyo) y cómo se leen las cantidades
                    (fichas o BB): compartidos por todas las mesas. */}
                <TableThemeProvider>
                  <TableDisplayProvider>
                    <RouterProvider router={router} />
                  </TableDisplayProvider>
                </TableThemeProvider>
              </SavedProvider>
            </AcademyContentProvider>
          </ProgressProvider>
          </AccessProvider>
        </CurriculumProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
