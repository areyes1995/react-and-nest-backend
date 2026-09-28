// ──────────────────────────────────────────────
// Router — tabla de rutas de la aplicación.
// La lógica de acceso (guards y redirecciones por
// permiso) vive en ./guards y ./records-route; aquí
// solo se declara el árbol de rutas.
// ──────────────────────────────────────────────

import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import LandingPage from '@pages/landing/LandingPage'
import Login from '@pages/login'
import NotFound from '@pages/NotFound'
import ResetPassword from '@pages/ResetPassword'
import VerifyEmail from '@pages/VerifyEmail'
import ForgotPassword from '@pages/ForgotPassword'
import { AppLayout } from '@components/layout'
import { ProtectedRoute, GuestRoute, PermissionRoute, LoadingScreen } from './guards'
import { RecordsRoute } from './records-route'
import CreateModuleView from '@components/settings/CreateModuleView'
import { CourseGate, PaywallGate } from '@components/access'
import SettingsView from '@components/settings/SettingsView'

// ── Academia ──
// Carga diferida: la mesa arrastra el motor y las páginas de progreso las
// gráficas. Sin esto, abrir el dashboard descargaría toda la plataforma.
// El <Suspense> que las cubre está en AppLayout.
const StudentHome = lazy(() => import('@pages/dashboard/home/StudentHome'))
const LearnPathPage = lazy(() => import('@pages/dashboard/learn/LearnPathPage'))
const ClassesPage = lazy(() => import('@pages/dashboard/classes/ClassesPage'))
const CoursePage = lazy(() => import('@pages/dashboard/classes/CoursePage'))
const LessonPage = lazy(() => import('@pages/dashboard/classes/LessonPage'))
const LessonPracticePage = lazy(() => import('@pages/dashboard/classes/LessonPracticePage'))
const ArticlesPage = lazy(() => import('@pages/dashboard/articles/ArticlesPage'))
const ArticlePage = lazy(() => import('@pages/dashboard/articles/ArticlePage'))
const VideosPage = lazy(() => import('@pages/dashboard/videos/VideosPage'))
const VideoPage = lazy(() => import('@pages/dashboard/videos/VideoPage'))
const GlossaryPage = lazy(() => import('@pages/dashboard/glossary/GlossaryPage'))
const SavedPage = lazy(() => import('@pages/dashboard/saved/SavedPage'))
const QuizPage = lazy(() => import('@pages/dashboard/quiz/QuizPage'))
const PlayPage = lazy(() => import('@pages/dashboard/play/PlayPage'))
const EquityPage = lazy(() => import('@pages/dashboard/tools/EquityPage'))
const RangesPage = lazy(() => import('@pages/dashboard/tools/RangesPage'))
const TrainerPage = lazy(() => import('@pages/dashboard/tools/TrainerPage'))
const OddsTrainerPage = lazy(() => import('@pages/dashboard/tools/OddsTrainerPage'))
const ProgressPage = lazy(() => import('@pages/dashboard/progress/ProgressPage'))
const AchievementsPage = lazy(() => import('@pages/dashboard/progress/AchievementsPage'))
const HandsPage = lazy(() => import('@pages/dashboard/progress/HandsPage'))
const SubscriptionPage = lazy(() => import('@pages/dashboard/subscription/SubscriptionPage'))
// Fuera del panel: se llega desde la landing y tiene su propio diseño.
const CheckoutPage = lazy(() => import('@pages/checkout/CheckoutPage'))

// ── Administración (módulo dinámico existente) ──
const AdminPage = lazy(() => import('@pages/dashboard/admin/AdminPage'))
const ContentAdminPage = lazy(() => import('@pages/dashboard/admin/ContentAdminPage'))
const NotificationsPage = lazy(() => import('@pages/dashboard/notifications/NotificationsPage'))
const ConfigPage = lazy(() => import('@pages/dashboard/config/ConfigPage'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: (
      <GuestRoute>
        <Login />
      </GuestRoute>
    ),
  },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/verify-email', element: <VerifyEmail /> },
  // Comprar un plan. La página misma exige sesión (y vuelve aquí tras el login).
  {
    path: '/checkout/:planId',
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <CheckoutPage />
      </Suspense>
    ),
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/app/home" replace /> },
      { path: 'home', element: <StudentHome /> },

      // ── Ruta de aprendizaje y clases ──
      { path: 'learn', element: <LearnPathPage /> },
      { path: 'classes', element: <ClassesPage /> },
      { path: 'classes/:courseSlug', element: <CoursePage /> },
      // Las clases pasan por CourseGate: muro de pago para los cursos fuera
      // del plan y el bloqueo al 60% si el estudiante lo activó.
      { path: 'classes/:courseSlug/:lessonSlug', element: <CourseGate><LessonPage /></CourseGate> },
      // La clase llevada a la mesa: pasos de la lección + mesa en vivo.
      { path: 'classes/:courseSlug/:lessonSlug/practica', element: <CourseGate><LessonPracticePage /></CourseGate> },

      // ── Biblioteca ──
      { path: 'articles', element: <ArticlesPage /> },
      { path: 'articles/:articleSlug', element: <ArticlePage /> },
      // Lo de pago se ve difuminado, con el botón de suscribirse encima
      // (reglas en features/access/rules.ts).
      { path: 'videos', element: <PaywallGate feature="videos"><VideosPage /></PaywallGate> },
      { path: 'videos/:videoSlug', element: <PaywallGate feature="videos"><VideoPage /></PaywallGate> },
      { path: 'glossary', element: <GlossaryPage /> },
      { path: 'saved', element: <PaywallGate feature="saved"><SavedPage /></PaywallGate> },
      // Banco de preguntas por nivel (y generación con IA).
      { path: 'quiz', element: <PaywallGate feature="quiz"><QuizPage /></PaywallGate> },

      // ── Mesa de práctica ──
      // Sin suscripción entra en modo demostración (lo decide la página).
      { path: 'play', element: <PlayPage /> },

      // ── Herramientas ──
      // La calculadora de equity es gratis; el resto, de pago.
      { path: 'tools/equity', element: <EquityPage /> },
      { path: 'tools/ranges', element: <PaywallGate feature="ranges"><RangesPage /></PaywallGate> },
      { path: 'tools/trainer', element: <PaywallGate feature="trainer"><TrainerPage /></PaywallGate> },
      { path: 'tools/odds', element: <PaywallGate feature="odds"><OddsTrainerPage /></PaywallGate> },

      // ── Progreso ──
      { path: 'progress', element: <ProgressPage /> },
      { path: 'progress/achievements', element: <AchievementsPage /> },
      { path: 'progress/hands', element: <HandsPage /> },

      // ── Cuenta ──
      { path: 'subscription', element: <SubscriptionPage /> },

      // ── Gestión ──
      { path: 'records/:base?/:view?', element: <RecordsRoute /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      {
        // Gestión de publicaciones del currículo: qué clases se ven y cuáles
        // llevan video. Mismo permiso que el resto de la administración.
        path: 'admin/content',
        element: (
          <PermissionRoute permission="module:permissions" fallback="/app/home">
            <ContentAdminPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'admin/config',
        element: (
          <PermissionRoute permission="module:permissions" fallback="/app/home">
            <ConfigPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'records/create',
        element: (
          <PermissionRoute permission="custom-module:create" fallback="/app/settings">
            <CreateModuleView />
          </PermissionRoute>
        ),
      },
      { path: 'settings', element: <SettingsView /> },
      {
        path: 'settings/create-module',
        element: (
          <PermissionRoute permission="custom-module:create" fallback="/app/settings">
            <CreateModuleView />
          </PermissionRoute>
        ),
      },

      { path: '*', element: <NotFound /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
