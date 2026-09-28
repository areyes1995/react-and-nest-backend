// ──────────────────────────────────────────────
// pricing — planes y accesos únicos de la academia.
//
// ⚠️  IMPORTES PROVISIONALES
// Todos los precios de este archivo son de ejemplo.
// Es el ÚNICO sitio donde aparecen: ninguna sección
// de la landing escribe una cifra a mano. Cambia los
// números de aquí y la página entera se actualiza.
//
// Los planes de pago llevan al checkout
// (/checkout/:planId). Sin pasarela configurada los
// pagos van en modo simulado (ver services/billing.ts).
// ⚠️ Los precios se repiten en el backend
// (modules/billing/config/billing.config.ts), que es
// quien calcula lo que se cobra: cámbialos en los dos.
// ──────────────────────────────────────────────

export const CURRENCY = 'USD'
export const CURRENCY_SYMBOL = '$'

export type BillingCycle = 'monthly' | 'annual'

export type PlanId = 'free' | 'premium' | 'gold'
export type PaidPlanId = Exclude<PlanId, 'free'>

export interface Plan {
  id: PlanId
  name: string
  /** Una línea: para quién es este plan. */
  tagline: string
  /** Precio mensual, y precio POR MES cuando se factura al año. */
  price: { monthly: number; annual: number }
  /** El plan que la tarjeta destaca como recomendado. */
  featured?: boolean
  cta: string
  /** Lo que incluye, en orden de importancia. */
  includes: string[]
  /** Lo que NO incluye. Vacío en el plan más alto. */
  excludes: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratis',
    tagline: 'Para ver si el póker es lo tuyo.',
    price: { monthly: 0, annual: 0 },
    cta: 'Empezar gratis',
    includes: [
      'Los 3 primeros cursos de Fundamentos',
      'Calculadora de equity',
      'Mesa de práctica en modo demostración',
      'Glosario y artículos abiertos',
      'Tu progreso guardado en la cuenta',
    ],
    excludes: [
      'Cash vs Torneos vs Spin y el resto de niveles',
      'Mesa de práctica jugable',
      'Rangos, entrenadores, preguntas y videos',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'El programa entero, a tu ritmo.',
    price: { monthly: 14.99, annual: 9.99 },
    featured: true,
    cta: 'Elegir Premium',
    includes: [
      'Todos los niveles, con todos sus cursos y clases',
      'Mesa de práctica sin límite, de 2 a 9 jugadores',
      'Análisis de cada decisión: equity real y pot odds',
      'Videotutoriales con capítulos navegables',
      'Herramientas: rangos, entrenador de odds y de manos',
      'Banco de preguntas y biblioteca de guardados',
    ],
    excludes: ['Revisión de manos con IA', 'Informes de progreso mensuales'],
  },
  {
    id: 'gold',
    name: 'Premium Gold',
    tagline: 'Para quien va en serio.',
    price: { monthly: 29.99, annual: 19.99 },
    cta: 'Elegir Gold',
    includes: [
      'Todo lo de Premium',
      'Revisión de tus manos con IA, jugada a jugada',
      'Informes de progreso mensuales con tus fugas',
      'Sesiones de entrenamiento dirigidas por objetivo',
      'Acceso anticipado a los cursos nuevos',
    ],
    excludes: [],
  },
]

// ─── Accesos únicos ───
// Se desbloquean para las cuentas que ya pasaron por
// Premium o Gold. Cuando la suscripción termina, el
// estudiante puede seguir pagando solo por lo que use.

export interface Pack {
  id: string
  name: string
  description: string
  /** Pago único, sin renovación. */
  price: number
  /** Cuánto dura el acceso que compras. */
  duration: string
}

export const PACKS: Pack[] = [
  {
    id: 'tools',
    name: 'Herramientas de estudio',
    description:
      'Calculadora de equity, matriz de rangos preflop y entrenador de manos iniciales.',
    price: 9.99,
    duration: '30 días',
  },
  {
    id: 'table',
    name: 'Mesa en vivo',
    description:
      'Práctica sin límite contra rivales con estilos reconocibles, de 2 a 9 jugadores.',
    price: 12.99,
    duration: '30 días',
  },
  {
    id: 'review',
    name: 'Análisis de decisiones',
    description:
      'Tu equity real, las pot odds que exigía cada apuesta y por qué la jugada fue correcta.',
    price: 14.99,
    duration: '30 días',
  },
  {
    id: 'level',
    name: 'Un nivel suelto',
    description:
      'Abre el nivel que te falte — Intermedio, Avanzado o Profesional — con sus 3 cursos.',
    price: 19.99,
    duration: 'Permanente',
  },
]

/** Precio con dos decimales solo cuando hacen falta: 9.99 → "9,99", 0 → "0". */
export function formatPrice(amount: number): string {
  if (amount === 0) return '0'
  return amount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Cuánto se ahorra al año pagando el ciclo anual, en porcentaje entero. */
export function annualSaving(plan: Plan): number {
  if (plan.price.monthly === 0) return 0
  return Math.round((1 - plan.price.annual / plan.price.monthly) * 100)
}

/** Lo que se cobra de una vez en el ciclo anual. */
export function annualTotal(plan: Plan): number {
  return Math.round(plan.price.annual * 12 * 100) / 100
}

export function findPlan(id: string | undefined): Plan | undefined {
  return PLANS.find(plan => plan.id === id)
}

export function isPaidPlanId(id: unknown): id is PaidPlanId {
  return id === 'premium' || id === 'gold'
}

/** Lo que se cobra al comprar un plan en un ciclo: un mes, o el año entero. */
export function chargeFor(planId: PaidPlanId, cycle: BillingCycle): number {
  const plan = findPlan(planId)!
  return cycle === 'annual' ? annualTotal(plan) : plan.price.monthly
}

// ─── Tabla comparativa ───
// Una fila por capacidad y un valor por plan. `true`
// marca incluido, `false` no incluido, y un texto se
// muestra tal cual (p. ej. "3 al día").

export interface ComparisonRow {
  feature: string
  free: boolean | string
  premium: boolean | string
  gold: boolean | string
}

export const COMPARISON: { group: string; rows: ComparisonRow[] }[] = [
  {
    group: 'Contenido',
    rows: [
      { feature: 'Cursos de Fundamentos', free: '3 primeros', premium: 'Todos', gold: 'Todos' },
      { feature: 'Resto de niveles (Postflop, Rangos, Teoría…)', free: false, premium: true, gold: true },
      { feature: 'Videotutoriales con capítulos', free: false, premium: true, gold: true },
      { feature: 'Banco de preguntas', free: false, premium: true, gold: true },
      { feature: 'Artículos y glosario', free: true, premium: true, gold: true },
      { feature: 'Acceso anticipado a cursos nuevos', free: false, premium: false, gold: true },
    ],
  },
  {
    group: 'Práctica',
    rows: [
      { feature: 'Mesa de práctica', free: 'Solo demostración', premium: 'Sin límite', gold: 'Sin límite' },
      { feature: 'Jugadores configurables (2 a 9)', free: false, premium: true, gold: true },
      { feature: 'Análisis de cada decisión', free: false, premium: true, gold: true },
      { feature: 'Revisión de manos con IA', free: false, premium: false, gold: true },
    ],
  },
  {
    group: 'Herramientas y seguimiento',
    rows: [
      { feature: 'Calculadora de equity', free: true, premium: true, gold: true },
      { feature: 'Rangos preflop y entrenadores de odds y manos', free: false, premium: true, gold: true },
      { feature: 'Progreso, racha y logros', free: true, premium: true, gold: true },
      { feature: 'Informes mensuales con tus fugas', free: false, premium: false, gold: true },
    ],
  },
]
