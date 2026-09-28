// ──────────────────────────────────────────────
// Router — tabla de rutas del starter base.
// Solo: login, recuperación, dashboard, usuarios,
// roles, permisos, notificaciones, IA, RAG y logs.
// ──────────────────────────────────────────────

import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import Login from '@pages/login'
import NotFound from '@pages/NotFound'
import ResetPassword from '@pages/ResetPassword'
import VerifyEmail from '@pages/VerifyEmail'
import ForgotPassword from '@pages/ForgotPassword'
import { AppLayout } from '@components/layout'
import { ProtectedRoute, GuestRoute, PermissionRoute, LoadingScreen } from './guards'

const DashboardHome = lazy(() => import('@pages/dashboard/home/DashboardHome'))
const UsersPage = lazy(() => import('@pages/dashboard/users/UsersPage'))
const NotificationsPage = lazy(() => import('@pages/dashboard/notifications/NotificationsPage'))
const RbacRolesView = lazy(() => import('@components/records/RbacRolesView'))
const RbacPermissionsView = lazy(() => import('@components/records/RbacPermissionsView'))
const AiPage = lazy(() => import('@pages/dashboard/ai/AiPage'))
const RagPage = lazy(() => import('@pages/dashboard/rag/RagPage'))
const LogsPage = lazy(() => import('@pages/dashboard/logs/LogsPage'))

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app/home" replace />,
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
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/app/home" replace /> },
      { path: 'home', element: <Lazy><DashboardHome /></Lazy> },
      {
        path: 'users',
        element: (
          <PermissionRoute permission="module:permissions" fallback="/app/home">
            <Lazy><UsersPage /></Lazy>
          </PermissionRoute>
        ),
      },
      {
        path: 'roles',
        element: (
          <PermissionRoute permission="module:permissions" fallback="/app/home">
            <Lazy><RbacRolesView view="summary" /></Lazy>
          </PermissionRoute>
        ),
      },
      {
        path: 'permissions',
        element: (
          <PermissionRoute permission="module:permissions" fallback="/app/home">
            <Lazy><RbacPermissionsView view="summary" /></Lazy>
          </PermissionRoute>
        ),
      },
      { path: 'notifications', element: <Lazy><NotificationsPage /></Lazy> },
      {
        path: 'ai',
        element: (
          <PermissionRoute permission="ai-analysis:read" fallback="/app/home">
            <Lazy><AiPage /></Lazy>
          </PermissionRoute>
        ),
      },
      {
        path: 'rag',
        element: (
          <PermissionRoute permission="rag:read" fallback="/app/home">
            <Lazy><RagPage /></Lazy>
          </PermissionRoute>
        ),
      },
      {
        path: 'logs',
        element: (
          <PermissionRoute permission="system-log:read" fallback="/app/home">
            <Lazy><LogsPage /></Lazy>
          </PermissionRoute>
        ),
      },
      { path: 'settings', element: <Lazy><DashboardHome /></Lazy> },
      { path: '*', element: <NotFound /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
