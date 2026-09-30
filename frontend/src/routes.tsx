// ──────────────────────────────────────────────
// Rutas de Educraft XYZ.
// ──────────────────────────────────────────────

import { lazy, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { hasPermission, isAdminUser } from '@services/auth'
import { readRedirect, rememberRedirect } from '@services/auth-redirect'
import { Spinner } from '@components/ui'
import AppShell from '@components/layout/AppShell'

const LoginPage = lazy(() => import('@pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@pages/auth/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('@pages/auth/VerifyEmailPage'))
const PublicParentReport = lazy(() => import('@pages/reports/PublicParentReport'))

const DashboardPage = lazy(() => import('@pages/home/DashboardPage'))
const PlanningPage = lazy(() => import('@pages/planning/PlanningPage'))
const LessonPlanEditor = lazy(() => import('@pages/planning/LessonPlanEditor'))
const ClassesPage = lazy(() => import('@pages/classes/ClassesPage'))
const PresentationEditor = lazy(() => import('@pages/classes/PresentationEditor'))
const ActivityPage = lazy(() => import('@pages/classes/ActivityPage'))
const ToolsPage = lazy(() => import('@pages/tools/ToolsPage'))
const AiPage = lazy(() => import('@pages/ai/AiPage'))
const EvaluationPage = lazy(() => import('@pages/evaluation/EvaluationPage'))
const ExamEditor = lazy(() => import('@pages/evaluation/ExamEditor'))
const StudentsPage = lazy(() => import('@pages/students/StudentsPage'))
const StudentRecordPage = lazy(() => import('@pages/students/StudentRecordPage'))
const TrackingPage = lazy(() => import('@pages/tracking/TrackingPage'))
const ResourcesPage = lazy(() => import('@pages/resources/ResourcesPage'))
const CalendarPage = lazy(() => import('@pages/calendar/CalendarPage'))
const ReportsPage = lazy(() => import('@pages/reports/ReportsPage'))
const SettingsPage = lazy(() => import('@pages/settings/SettingsPage'))
const NotificationsPage = lazy(() => import('@pages/notifications/NotificationsPage'))
const AdminPage = lazy(() => import('@pages/admin/AdminPage'))
const NotFound = lazy(() => import('@pages/NotFound'))

function FullScreenLoader() {
  return (
    <div className="frame grid h-dvh place-items-center">
      <Spinner label="Cargando Educraft XYZ…" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <FullScreenLoader />
  if (!isAuthenticated) {
    rememberRedirect(location.pathname + location.search)
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <FullScreenLoader />
  if (isAuthenticated) return <Navigate to={readRedirect('/app/inicio')} replace />
  return <>{children}</>
}

/** Exige un permiso RBAC (los administradores pasan siempre). */
function Require({ permission, admin, children }: { permission?: string; admin?: boolean; children: ReactNode }) {
  const { user } = useAuth()
  const allowed = isAdminUser(user) || (!admin && (!permission || hasPermission(user, permission)))
  return allowed ? <>{children}</> : <Navigate to="/app/inicio" replace />
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/app/inicio" replace /> },
  { path: '/login', element: <GuestRoute><LoginPage /></GuestRoute> },
  { path: '/registro', element: <GuestRoute><RegisterPage /></GuestRoute> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/familia/:token', element: <PublicParentReport /> },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/app/inicio" replace /> },
      { path: 'inicio', element: <DashboardPage /> },
      { path: 'planificacion', element: <Require permission="planning:manage"><PlanningPage /></Require> },
      { path: 'planificacion/planes/nuevo', element: <Require permission="planning:manage"><LessonPlanEditor /></Require> },
      { path: 'planificacion/planes/:id', element: <Require permission="planning:manage"><LessonPlanEditor /></Require> },
      { path: 'clases', element: <Require permission="planning:manage"><ClassesPage /></Require> },
      { path: 'clases/presentaciones/:id', element: <Require permission="planning:manage"><PresentationEditor /></Require> },
      { path: 'clases/actividades/:id', element: <Require permission="planning:manage"><ActivityPage /></Require> },
      { path: 'herramientas', element: <ToolsPage /> },
      { path: 'ia', element: <Require permission="ai-pedagogy:use"><AiPage /></Require> },
      { path: 'evaluacion', element: <Require permission="evaluation:manage"><EvaluationPage /></Require> },
      { path: 'evaluacion/examenes/:id', element: <Require permission="evaluation:manage"><ExamEditor /></Require> },
      { path: 'estudiantes', element: <Require permission="academic:manage"><StudentsPage /></Require> },
      { path: 'estudiantes/:id', element: <Require permission="academic:manage"><StudentRecordPage /></Require> },
      { path: 'seguimiento', element: <Require permission="report:manage"><TrackingPage /></Require> },
      { path: 'recursos', element: <Require permission="library:manage"><ResourcesPage /></Require> },
      { path: 'calendario', element: <Require permission="planning:manage"><CalendarPage /></Require> },
      { path: 'reportes', element: <Require permission="report:manage"><ReportsPage /></Require> },
      { path: 'ajustes', element: <SettingsPage /> },
      { path: 'notificaciones', element: <NotificationsPage /> },
      { path: 'admin', element: <Require admin><AdminPage /></Require> },
      { path: '*', element: <NotFound /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
