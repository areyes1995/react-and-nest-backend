// ──────────────────────────────────────────────
// Configuración de pagos — todo por .env.
//
//   PAYMENTS_LIVE=true        → pagos reales: hace
//                               falta una pasarela.
//   PAYMENTS_PROVIDER=stripe  → pasarela elegida
//                   | paypal    (poner una ya activa
//                   | google    los pagos reales).
//
// Sin ninguna de las dos (el estado por defecto) los
// pagos van en MODO SIMULADO: el checkout completa la
// compra sin cobrar y la suscripción se activa, para
// poder probar la plataforma entera.
//
// Con los pagos reales activados, mientras la pasarela
// no esté integrada el checkout se niega a completar la
// compra: nunca se regala acceso por un pago que no se
// hizo.
// ──────────────────────────────────────────────

export type PaymentProviderId = 'stripe' | 'paypal' | 'google';

export const PAYMENT_PROVIDERS: PaymentProviderId[] = ['stripe', 'paypal', 'google'];

/** Pasarelas con integración real en el backend. Vacío: ninguna todavía. */
export const INTEGRATED_PROVIDERS = new Set<PaymentProviderId>();

export type PaymentsMode = 'simulated' | 'live';

export interface BillingSettings {
  mode: PaymentsMode;
  /** Pasarela configurada; `null` si ninguna. */
  provider: PaymentProviderId | null;
  /** La pasarela configurada está integrada y puede cobrar. */
  ready: boolean;
}

export function readBillingSettings(env: NodeJS.ProcessEnv = process.env): BillingSettings {
  const raw = (env.PAYMENTS_PROVIDER ?? '').trim().toLowerCase();
  const provider = PAYMENT_PROVIDERS.includes(raw as PaymentProviderId)
    ? (raw as PaymentProviderId)
    : null;
  const liveFlag = (env.PAYMENTS_LIVE ?? '').trim().toLowerCase() === 'true';
  const mode: PaymentsMode = liveFlag || provider ? 'live' : 'simulated';
  return {
    mode,
    provider,
    ready: mode === 'simulated' || (provider !== null && INTEGRATED_PROVIDERS.has(provider)),
  };
}

// ─── Precios ───
// ⚠️ Deben coincidir con frontend/src/features/pricing/plans.ts. El importe
// se calcula SIEMPRE aquí: el cliente solo dice qué plan y qué ciclo quiere.

export type PaidPlanId = 'premium' | 'gold';
export type BillingCycle = 'monthly' | 'annual';

export const CURRENCY = 'USD';

/** Precio por mes (en el ciclo anual, el precio mensual equivalente). */
export const PLAN_PRICES: Record<PaidPlanId, Record<BillingCycle, number>> = {
  premium: { monthly: 14.99, annual: 9.99 },
  gold: { monthly: 29.99, annual: 19.99 },
};

/** Lo que se cobra de una vez por el ciclo. */
export function chargeFor(planId: PaidPlanId, cycle: BillingCycle): number {
  const perMonth = PLAN_PRICES[planId][cycle];
  return Math.round((cycle === 'annual' ? perMonth * 12 : perMonth) * 100) / 100;
}

/** Fin del periodo pagado a partir de `from`. */
export function periodEnd(cycle: BillingCycle, from: Date = new Date()): Date {
  const end = new Date(from);
  if (cycle === 'annual') end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}
