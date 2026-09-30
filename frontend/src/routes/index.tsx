// ──────────────────────────────────────────────
// Router — tabla de rutas del starter base.
// Login, recuperación, Trading Risk Manager (/app/trading/*),
// usuarios, roles, permisos, notificaciones, IA, RAG y logs.
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
const TradingDashboard = lazy(() => import('@pages/dashboard/trading/TradingDashboard'))
const RiskCalculatorPage = lazy(() => import('@pages/dashboard/trading/RiskCalculatorPage'))
const JournalPage = lazy(() => import('@pages/dashboard/trading/JournalPage'))
const StatsPage = lazy(() => import('@pages/dashboard/trading/StatsPage'))
const FundingAccountsPage = lazy(() => import('@pages/dashboard/trading/FundingAccountsPage'))
const ChallengePlannerPage = lazy(() => import('@pages/dashboard/trading/ChallengePlannerPage'))
const FinancePage = lazy(() => import('@pages/dashboard/trading/FinancePage'))
const PayoutsPage = lazy(() => import('@pages/dashboard/trading/PayoutsPage'))
const GrowthPage = lazy(() => import('@pages/dashboard/trading/GrowthPage'))
const TradingSettingsPage = lazy(() => import('@pages/dashboard/trading/TradingSettingsPage'))

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app/trading" replace />,
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
      { index: true, element: <Navigate to="/app/trading" replace /> },
      { path: 'home', element: <Lazy><DashboardHome /></Lazy> },
      // Trading Risk Manager
      { path: 'trading', element: <Lazy><TradingDashboard /></Lazy> },
      { path: 'trading/risk', element: <Lazy><RiskCalculatorPage /></Lazy> },
      { path: 'trading/journal', element: <Lazy><JournalPage /></Lazy> },
      { path: 'trading/stats', element: <Lazy><StatsPage /></Lazy> },
      { path: 'trading/funding', element: <Lazy><FundingAccountsPage /></Lazy> },
      { path: 'trading/challenge', element: <Lazy><ChallengePlannerPage /></Lazy> },
      { path: 'trading/finance', element: <Lazy><FinancePage /></Lazy> },
      { path: 'trading/payouts', element: <Lazy><PayoutsPage /></Lazy> },
      { path: 'trading/growth', element: <Lazy><GrowthPage /></Lazy> },
      { path: 'trading/settings', element: <Lazy><TradingSettingsPage /></Lazy> },
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
