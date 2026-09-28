// ──────────────────────────────────────────────
// AccessContext — qué puede ver el usuario.
//
// Reúne la suscripción (services/billing) y las
// reglas de lo gratis (./rules) en una sola
// pregunta por página: `canUse('ranges')`,
// `canOpenCourse(course)`…
//
// Además guarda la preferencia de DESBLOQUEO
// PROGRESIVO: con ella encendida, cada nivel se abre
// al completar el 60% del anterior (lo de siempre);
// apagada, todas las clases a las que da acceso el
// plan están abiertas desde el primer día. Por
// defecto, apagada; es para quien prefiere avanzar
// paso a paso.
//
// Los administradores ven todo sin suscripción:
// gestionan el contenido y tienen que poder revisarlo.
// ──────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@context/AuthContext'
import { isAdminUser } from '@services/auth'
import {
  cancelSubscription,
  checkout as apiCheckout,
  fetchBillingConfig,
  fetchSubscription,
  type BillingConfig,
  type CheckoutRequest,
  type CheckoutResult,
  type Subscription,
} from '@services/billing'
import { useCurriculum, useOptionalCurriculum } from '@features/academy/CurriculumContext'
import type { Course, LevelId } from '@features/academy/types'
import type { PlanId } from '@features/pricing/plans'
import { freeCourseIds, isFreeCourse, type PaidFeature } from './rules'

const PROGRESSIVE_KEY = 'academy:progressive-unlock'

export type AccessStatus = 'loading' | 'ready'

export interface AccessContextValue {
  status: AccessStatus
  /** Plan efectivo: `free` sin suscripción vigente. */
  plan: PlanId
  subscription: Subscription | null
  /** Suscripción vigente o administrador: todo abierto. */
  hasFullAccess: boolean
  isAdmin: boolean
  billing: BillingConfig | null
  canUse: (feature: PaidFeature) => boolean
  /** El curso entra en el plan (gratis o pagado). No mira el 60%. */
  canOpenCourse: (course: Pick<Course, 'id'>) => boolean
  /** Desbloqueo por niveles al 60%, activado por el estudiante. */
  progressive: boolean
  setProgressive: (value: boolean) => void
  /** Nivel abierto según la preferencia de desbloqueo progresivo. */
  isLevelUnlocked: (levelId: LevelId, completed: Record<string, unknown>) => boolean
  checkout: (request: CheckoutRequest) => Promise<CheckoutResult>
  cancel: () => Promise<boolean>
  refresh: () => Promise<void>
}

const AccessContext = createContext<AccessContextValue | null>(null)

function readProgressive(): boolean {
  try {
    return localStorage.getItem(PROGRESSIVE_KEY) === 'true'
  } catch {
    return false
  }
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const curriculum = useCurriculum()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [billing, setBilling] = useState<BillingConfig | null>(null)
  const [status, setStatus] = useState<AccessStatus>('loading')
  const [progressive, setProgressiveState] = useState(readProgressive)

  const userId = user?.id ?? null

  const refresh = useCallback(async () => {
    if (!userId) {
      setSubscription(null)
      setStatus('ready')
      return
    }
    const [state, config] = await Promise.all([fetchSubscription(userId), fetchBillingConfig()])
    setSubscription(state.subscription)
    setBilling(config)
    setStatus('ready')
  }, [userId])

  // Cambiar de usuario vuelve a preguntar: la suscripción es de la cuenta.
  useEffect(() => {
    setStatus('loading')
    void refresh()
  }, [refresh])

  const setProgressive = useCallback((value: boolean) => {
    setProgressiveState(value)
    try {
      localStorage.setItem(PROGRESSIVE_KEY, String(value))
    } catch {
      // Almacenamiento bloqueado: vale para esta sesión.
    }
  }, [])

  const checkout = useCallback(
    async (request: CheckoutRequest): Promise<CheckoutResult> => {
      if (!userId) return { ok: false, error: 'Inicia sesión para completar la compra.' }
      const result = await apiCheckout(userId, request)
      if (result.ok) setSubscription(result.subscription)
      return result
    },
    [userId],
  )

  const cancel = useCallback(async () => {
    if (!userId) return false
    const ok = await cancelSubscription(userId)
    if (ok) setSubscription(null)
    return ok
  }, [userId])

  const value = useMemo<AccessContextValue>(() => {
    const isAdmin = isAdminUser(user)
    const hasFullAccess = isAdmin || subscription !== null
    const free = freeCourseIds(curriculum)
    return {
      status,
      plan: subscription?.planId ?? 'free',
      subscription,
      hasFullAccess,
      isAdmin,
      billing,
      canUse: () => hasFullAccess,
      canOpenCourse: course => hasFullAccess || isFreeCourse(course, free),
      progressive,
      setProgressive,
      isLevelUnlocked: (levelId, completed) =>
        !progressive || curriculum.isLevelUnlocked(levelId, completed),
      checkout,
      cancel,
      refresh,
    }
  }, [user, subscription, curriculum, status, billing, progressive, setProgressive, checkout, cancel, refresh])

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}

/** Acceso del usuario. Fuera del provider (tests de componentes sueltos), todo abierto. */
export function useAccess(): AccessContextValue {
  const context = useContext(AccessContext)
  const curriculum = useOptionalCurriculum()
  return (
    context ?? {
      status: 'ready',
      plan: 'free',
      subscription: null,
      hasFullAccess: true,
      isAdmin: false,
      billing: null,
      canUse: () => true,
      canOpenCourse: () => true,
      progressive: true,
      setProgressive: () => {},
      isLevelUnlocked: curriculum.isLevelUnlocked,
      checkout: async () => ({ ok: false, error: 'Sin proveedor de acceso.' }),
      cancel: async () => false,
      refresh: async () => {},
    }
  )
}
