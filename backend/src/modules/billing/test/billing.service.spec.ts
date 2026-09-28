import { NotImplementedException, ServiceUnavailableException } from '@nestjs/common';
import { BillingService } from 'src/modules/billing/services/billing.service';
import { chargeFor, readBillingSettings } from 'src/modules/billing/config/billing.config';

function makePrisma() {
  const row = {
    id: 1,
    planId: 'premium',
    cycle: 'annual',
    status: 'ACTIVE',
    provider: 'simulated',
    method: 'card',
    amount: 119.88,
    currency: 'USD',
    currentPeriodEnd: new Date('2027-01-01'),
    canceledAt: null,
    createdAt: new Date('2026-01-01'),
  };
  const subscription = {
    findFirst: jest.fn().mockResolvedValue(null),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    create: jest.fn().mockResolvedValue(row),
  };
  return {
    subscription,
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn({ subscription })),
  } as any;
}

const dto = { planId: 'premium', cycle: 'annual', method: 'card', cardLast4: '4242' } as const;

describe('readBillingSettings', () => {
  it('sin variables → modo simulado y listo', () => {
    expect(readBillingSettings({})).toEqual({ mode: 'simulated', provider: null, ready: true });
  });

  it('PAYMENTS_LIVE=true o una pasarela → modo real, sin integrar todavía', () => {
    expect(readBillingSettings({ PAYMENTS_LIVE: 'true' })).toMatchObject({ mode: 'live', ready: false });
    expect(readBillingSettings({ PAYMENTS_PROVIDER: 'stripe' })).toMatchObject({
      mode: 'live',
      provider: 'stripe',
      ready: false,
    });
  });
});

describe('BillingService', () => {
  it('modo simulado: la compra activa la suscripción con el importe del servidor', async () => {
    const prisma = makePrisma();
    const svc = new BillingService(prisma, () => readBillingSettings({}));
    const out = await svc.checkout(7, dto as any);
    expect(out.subscription?.planId).toBe('premium');
    expect(prisma.subscription.updateMany).toHaveBeenCalled();
    expect(prisma.subscription.create.mock.calls[0][0].data).toMatchObject({
      userId: 7,
      provider: 'simulated',
      amount: chargeFor('premium', 'annual'),
    });
  });

  it('pagos reales sin pasarela integrada: no se completa la compra', async () => {
    const prisma = makePrisma();
    const stripe = new BillingService(prisma, () => readBillingSettings({ PAYMENTS_PROVIDER: 'stripe' }));
    await expect(stripe.checkout(7, dto as any)).rejects.toBeInstanceOf(NotImplementedException);
    const noProvider = new BillingService(prisma, () => readBillingSettings({ PAYMENTS_LIVE: 'true' }));
    await expect(noProvider.checkout(7, dto as any)).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.subscription.create).not.toHaveBeenCalled();
  });

  it('sin tabla: el usuario queda en el plan gratis', async () => {
    const prisma = makePrisma();
    prisma.subscription.findFirst.mockRejectedValue({ code: 'P2021' });
    const svc = new BillingService(prisma, () => readBillingSettings({}));
    await expect(svc.current(7)).resolves.toEqual({ subscription: null, persisted: false });
  });
});
