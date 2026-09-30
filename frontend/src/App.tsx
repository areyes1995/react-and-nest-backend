// ──────────────────────────────────────────────
// Educraft XYZ — raíz de la aplicación
// ──────────────────────────────────────────────

import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@context/AuthContext'
import { ThemeProvider } from '@context/ThemeContext'
import { FeedbackProvider } from '@context/ToastContext'
import { Spinner } from '@components/ui'
import { router } from './routes'

export default function App() {
  return (
    <ThemeProvider>
      <FeedbackProvider>
        <AuthProvider>
          <Suspense fallback={<Spinner label="Cargando…" />}>
            <RouterProvider router={router} />
          </Suspense>
        </AuthProvider>
      </FeedbackProvider>
    </ThemeProvider>
  )
}
