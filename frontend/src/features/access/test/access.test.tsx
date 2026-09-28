// ──────────────────────────────────────────────
// Acceso y suscripción: qué es gratis, cuándo se
// puede cobrar y qué ve cada usuario.
// ──────────────────────────────────────────────

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { createCurriculum } from '@features/academy/curriculum'
import { FIXTURE_LEVELS } from '@features/academy/test/fixtures'
import type { Level } from '@features/academy/types'

const auth = vi.hoisted(() => ({ user: null as null | { id: string; roles: string[] } }))
const billing = vi.hoisted(() => ({
  fetchSubscription: vi.fn(),
  fetchBillingConfig: vi.fn(),
  checkout: vi.fn(),
  cancelSubscription: vi.fn(),
}))

// Fundamentos con 5 cursos: los 3 primeros gratis, el de formatos siempre de pago.
const LEVELS: Level[] = [
  {
    ...FIXTURE_LEVELS[0],
    courses: [
      ...FIXTURE_LEVELS[0].courses,
      { ...FIXTURE_LEVELS[0].courses[0], id: 'formatos', slug: 'cash-vs-torneos-vs-spin' },
      { ...FIXTURE_LEVELS[0].courses[0], id: 'mates', slug: 'mates' },
      { ...FIXTURE_LEVELS[0].courses[0], id: 'extra', slug: 'extra' },
    ],
  },
  FIXTURE_LEVELS[1],
]
const curriculum = createCurriculum(LEVELS)

vi.mock('@context/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('@services/billing', async importOriginal => ({
  ...(await importOriginal<typeof import('@services/billing')>()),
  ...billing,
}))
vi.mock('@features/academy/CurriculumContext', () => ({
  useCurriculum: () => curriculum,
  useOptionalCurriculum: () => curriculum,
}))

import { readMockBillingConfig } from '@services/billing'
import { freeCourseIds } from '@features/access/rules'
import { AccessProvider, useAccess } from '@features/access/AccessContext'
import PaywallGate from '@components/access/PaywallGate'
import { expiryValid, luhnValid } from '@pages/checkout/CheckoutPage'

const ACTIVE = {
  id: 1,
  planId: 'premium',
  cycle: 'annual',
  status: 'active',
  provider: 'simulated',
  method: 'card',
  amount: 119.88,
  currency: 'USD',
  currentPeriodEnd: '2099-01-01T00:00:00.000Z',
  canceledAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => {
  localStorage.clear()
  auth.user = { id: '7', roles: ['GUEST'] }
  billing.fetchSubscription.mockReset().mockResolvedValue({ subscription: null, persisted: true })
  billing.fetchBillingConfig.mockReset().mockResolvedValue({ mode: 'simulated', provider: null, ready: true })
})

describe('reglas de lo gratis', () => {
  it('abre los 3 primeros cursos de Fundamentos, nunca Cash vs Torneos vs Spin', () => {
    expect([...freeCourseIds(curriculum)]).toEqual(['reglas', 'posicion', 'mates'])
  })
})

describe('configuración de pagos (modo mock)', () => {
  it('sin variables: simulado y se puede comprar', () => {
    expect(readMockBillingConfig({})).toEqual({ mode: 'simulated', provider: null, ready: true })
  })

  it('con pagos reales o una pasarela: no se completa ninguna compra todavía', () => {
    expect(readMockBillingConfig({ VITE_PAYMENTS_LIVE: 'true' })).toMatchObject({ mode: 'live', ready: false })
    expect(readMockBillingConfig({ VITE_PAYMENTS_PROVIDER: 'paypal' })).toMatchObject({
      mode: 'live',
      provider: 'paypal',
      ready: false,
    })
  })
})

describe('validación de la tarjeta', () => {
  it('Luhn y caducidad', () => {
    expect(luhnValid('4242424242424242')).toBe(true)
    expect(luhnValid('4242424242424241')).toBe(false)
    expect(expiryValid('12/99', new Date('2026-09-27'))).toBe(true)
    expect(expiryValid('01/20', new Date('2026-09-27'))).toBe(false)
    expect(expiryValid('13/30', new Date('2026-09-27'))).toBe(false)
  })
})

function Probe() {
  const access = useAccess()
  const course = (id: string) => curriculum.courses.find(c => c.id === id)!
  return (
    <p>
      {access.status}|{access.plan}|{String(access.canUse('ranges'))}|
      {String(access.canOpenCourse(course('reglas')))}|{String(access.canOpenCourse(course('formatos')))}|
      {String(access.isLevelUnlocked('intermediate', {}))}
    </p>
  )
}

function renderAccess(children: React.ReactNode) {
  return render(
    <MemoryRouter>
      <AccessProvider>{children}</AccessProvider>
    </MemoryRouter>,
  )
}

describe('AccessProvider', () => {
  it('plan gratis: solo los cursos gratis y nada de las herramientas de pago', async () => {
    renderAccess(<Probe />)
    expect(await screen.findByText('ready|free|false|true|false|true')).toBeInTheDocument()
  })

  it('con suscripción: todo abierto', async () => {
    billing.fetchSubscription.mockResolvedValue({ subscription: ACTIVE, persisted: true })
    renderAccess(<Probe />)
    expect(await screen.findByText('ready|premium|true|true|true|true')).toBeInTheDocument()
  })

  it('el administrador ve todo sin suscripción', async () => {
    auth.user = { id: '1', roles: ['ADMIN'] }
    renderAccess(<Probe />)
    expect(await screen.findByText('ready|free|true|true|true|true')).toBeInTheDocument()
  })

  it('desbloqueo progresivo: el nivel siguiente espera al 60% del anterior', async () => {
    localStorage.setItem('academy:progressive-unlock', 'true')
    billing.fetchSubscription.mockResolvedValue({ subscription: ACTIVE, persisted: true })
    renderAccess(<Probe />)
    expect(await screen.findByText('ready|premium|true|true|true|false')).toBeInTheDocument()
  })
})

describe('PaywallGate', () => {
  it('sin suscripción difumina la página y pide suscribirse', async () => {
    renderAccess(
      <PaywallGate feature="ranges">
        <p>Tabla de rangos</p>
      </PaywallGate>,
    )
    expect(await screen.findByText('Desbloquea los rangos preflop')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Suscribirme/ })).toHaveAttribute('href', '/checkout/premium')
    // El contenido sigue ahí (se ve difuminado) pero no se puede usar.
    expect(screen.getByText('Tabla de rangos').closest('[inert]')).not.toBeNull()
  })

  it('con suscripción no se interpone', async () => {
    billing.fetchSubscription.mockResolvedValue({ subscription: ACTIVE, persisted: true })
    renderAccess(
      <PaywallGate feature="ranges">
        <p>Tabla de rangos</p>
      </PaywallGate>,
    )
    await waitFor(() => expect(billing.fetchSubscription).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByText(/Desbloquea/)).not.toBeInTheDocument())
    expect(screen.getByText('Tabla de rangos').closest('[inert]')).toBeNull()
  })
})
