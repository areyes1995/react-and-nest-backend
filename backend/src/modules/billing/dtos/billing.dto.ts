// ──────────────────────────────────────────────
// DTOs de pagos y suscripciones.
// El cliente nunca manda el importe ni los datos
// completos de la tarjeta: solo plan, ciclo y
// método (y, en modo simulado, los 4 últimos
// dígitos para enseñarlos en el recibo).
// ──────────────────────────────────────────────

import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import type { BillingCycle, PaidPlanId, PaymentsMode, PaymentProviderId } from '../config/billing.config';

export const CHECKOUT_METHODS = ['card', 'paypal', 'google'] as const;
export type CheckoutMethod = (typeof CHECKOUT_METHODS)[number];

export class CheckoutDto {
  @IsIn(['premium', 'gold'])
  planId: PaidPlanId;

  @IsIn(['monthly', 'annual'])
  cycle: BillingCycle;

  @IsIn(CHECKOUT_METHODS as unknown as string[])
  method: CheckoutMethod;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'cardLast4 son exactamente 4 dígitos.' })
  cardLast4?: string;
}

export interface BillingConfigView {
  mode: PaymentsMode;
  provider: PaymentProviderId | null;
  ready: boolean;
}

export interface SubscriptionView {
  id: number;
  planId: PaidPlanId;
  cycle: BillingCycle;
  status: 'active' | 'canceled';
  provider: string;
  method: string;
  amount: number;
  currency: string;
  currentPeriodEnd: string;
  canceledAt: string | null;
  createdAt: string;
}

export interface SubscriptionStateView {
  /** Suscripción vigente; `null` si el usuario está en el plan gratis. */
  subscription: SubscriptionView | null;
  /** `false` si la tabla aún no existe (migración sin aplicar). */
  persisted: boolean;
}
