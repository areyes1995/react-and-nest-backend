// ──────────────────────────────────────────────
// BillingService — suscripciones de la academia.
//
// La suscripción vigente es la última ACTIVE cuyo
// periodo no ha terminado. Cancelar la marca como
// CANCELED al momento (en modo simulado no hay nada
// que reembolsar ni que esperar).
//
// Igual que el resto de módulos nuevos, si la tabla
// no existe (migración sin aplicar) no revienta:
// responde `persisted: false` y el usuario queda en
// el plan gratis.
// ──────────────────────────────────────────────

import {
  Injectable,
  Logger,
  NotImplementedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  CURRENCY,
  chargeFor,
  periodEnd,
  readBillingSettings,
  type BillingSettings,
  type PaidPlanId,
  type BillingCycle,
} from '../config/billing.config';
import type {
  BillingConfigView,
  CheckoutDto,
  SubscriptionStateView,
  SubscriptionView,
} from '../dtos/billing.dto';

/** Códigos de Prisma que significan "la tabla todavía no está". */
const MISSING_TABLE_CODES = new Set(['P2021', 'P2022']);

const PROVIDER_LABEL = { stripe: 'Stripe', paypal: 'PayPal', google: 'Google Pay' } as const;

interface SubscriptionRow {
  id: number;
  planId: string;
  cycle: string;
  status: 'ACTIVE' | 'CANCELED';
  provider: string;
  method: string;
  amount: { toString(): string } | number;
  currency: string;
  currentPeriodEnd: Date;
  canceledAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    /** Inyectable para los tests; por defecto, el .env. */
    private readonly settings: () => BillingSettings = () => readBillingSettings(),
  ) {}

  config(): BillingConfigView {
    const { mode, provider, ready } = this.settings();
    return { mode, provider, ready };
  }

  async current(userId: number): Promise<SubscriptionStateView> {
    try {
      const row = await this.prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE', currentPeriodEnd: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      });
      return { subscription: row ? this.toView(row) : null, persisted: true };
    } catch (err) {
      if (this.isMissingTable(err)) return this.missingTable();
      throw err;
    }
  }

  async checkout(userId: number, dto: CheckoutDto): Promise<SubscriptionStateView> {
    const settings = this.settings();

    // Pagos reales activados: sin pasarela integrada no se completa nada.
    if (settings.mode === 'live') {
      if (!settings.provider) {
        throw new ServiceUnavailableException(
          'Los pagos reales están activados (PAYMENTS_LIVE=true) pero no hay pasarela configurada. Define PAYMENTS_PROVIDER=stripe|paypal|google.',
        );
      }
      if (!settings.ready) {
        throw new NotImplementedException(
          `La pasarela ${PROVIDER_LABEL[settings.provider]} todavía no está integrada: no se puede cobrar. Quita PAYMENTS_LIVE y PAYMENTS_PROVIDER del .env para volver al modo simulado.`,
        );
      }
    }

    // Modo simulado: la compra se completa sin cobrar.
    const planId: PaidPlanId = dto.planId;
    const cycle: BillingCycle = dto.cycle;
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        // Cambiar de plan sustituye al vigente: nunca hay dos activos.
        await tx.subscription.updateMany({
          where: { userId, status: 'ACTIVE' },
          data: { status: 'CANCELED', canceledAt: new Date() },
        });
        return tx.subscription.create({
          data: {
            userId,
            planId,
            cycle,
            status: 'ACTIVE',
            provider: 'simulated',
            providerRef: dto.cardLast4 ? `card-****${dto.cardLast4}` : null,
            method: dto.method,
            amount: chargeFor(planId, cycle),
            currency: CURRENCY,
            currentPeriodEnd: periodEnd(cycle),
          },
        });
      });
      this.logger.log(`Suscripción simulada ${planId}/${cycle} para el usuario ${userId}.`);
      return { subscription: this.toView(row), persisted: true };
    } catch (err) {
      if (this.isMissingTable(err)) {
        throw new ServiceUnavailableException(
          'La tabla de suscripciones no existe todavía: ejecuta `pnpm db:migrate`.',
        );
      }
      throw err;
    }
  }

  async cancel(userId: number): Promise<SubscriptionStateView> {
    try {
      await this.prisma.subscription.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'CANCELED', canceledAt: new Date() },
      });
      return { subscription: null, persisted: true };
    } catch (err) {
      if (this.isMissingTable(err)) return this.missingTable();
      throw err;
    }
  }

  private toView(row: SubscriptionRow): SubscriptionView {
    return {
      id: row.id,
      planId: row.planId as PaidPlanId,
      cycle: row.cycle as BillingCycle,
      status: row.status === 'ACTIVE' ? 'active' : 'canceled',
      provider: row.provider,
      method: row.method,
      amount: Number(row.amount.toString()),
      currency: row.currency,
      currentPeriodEnd: row.currentPeriodEnd.toISOString(),
      canceledAt: row.canceledAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private missingTable(): SubscriptionStateView {
    this.logger.warn('La tabla Subscription no existe todavía: ejecuta `pnpm db:migrate`.');
    return { subscription: null, persisted: false };
  }

  private isMissingTable(err: unknown): boolean {
    const code = (err as { code?: string })?.code;
    return code !== undefined && MISSING_TABLE_CODES.has(code);
  }
}
