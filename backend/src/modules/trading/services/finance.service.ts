import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DistributionKind, IncomeSource, Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreateIncomeDto,
  CreatePayoutDto,
  UpdateIncomeDto,
} from '../dto/trading.dto';
import {
  allocate,
  Bucket,
  DEFAULT_INCOME_BUCKETS,
  DEFAULT_PAYOUT_BUCKETS,
  validateBuckets,
} from '../domain/allocation';
import { round2, sum } from '../domain/time.util';

const DEFAULT_BUCKETS: Record<DistributionKind, Bucket[]> = {
  INCOME: DEFAULT_INCOME_BUCKETS,
  PAYOUT: DEFAULT_PAYOUT_BUCKETS,
};

/** `YYYY-MM` → primer día del mes en UTC (columna DATE). */
function monthToDate(month: string): Date {
  return new Date(`${month}-01T00:00:00.000Z`);
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Planes de distribución ───────────────────

  async getPlan(userId: number, kind: DistributionKind): Promise<Bucket[]> {
    const plan = await this.prisma.distributionPlan.findUnique({
      where: { userId_kind: { userId, kind } },
    });
    return plan ? (plan.buckets as unknown as Bucket[]) : DEFAULT_BUCKETS[kind];
  }

  async getPlans(userId: number) {
    const [income, payout] = await Promise.all([
      this.getPlan(userId, 'INCOME'),
      this.getPlan(userId, 'PAYOUT'),
    ]);
    return { INCOME: income, PAYOUT: payout };
  }

  async updatePlan(userId: number, kind: DistributionKind, buckets: Bucket[]) {
    const error = validateBuckets(buckets);
    if (error) throw new BadRequestException(error);
    const json = buckets as unknown as Prisma.InputJsonValue;
    await this.prisma.distributionPlan.upsert({
      where: { userId_kind: { userId, kind } },
      update: { buckets: json },
      create: { userId, kind, buckets: json },
    });
    return buckets;
  }

  // ─── Ingresos ─────────────────────────────────

  async listIncomes(userId: number, month?: string) {
    return this.prisma.incomeEntry.findMany({
      where: { userId, ...(month ? { period: monthToDate(month) } : {}) },
      orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createIncome(userId: number, dto: CreateIncomeDto) {
    const { month, ...data } = dto;
    return this.prisma.incomeEntry.create({
      data: { ...data, period: monthToDate(month), userId },
    });
  }

  async updateIncome(userId: number, id: number, dto: UpdateIncomeDto) {
    await this.findIncome(userId, id);
    const { month, ...data } = dto;
    return this.prisma.incomeEntry.update({
      where: { id },
      data: { ...data, ...(month ? { period: monthToDate(month) } : {}) },
    });
  }

  async removeIncome(userId: number, id: number) {
    await this.findIncome(userId, id);
    await this.prisma.incomeEntry.delete({ where: { id } });
    return { id };
  }

  private async findIncome(userId: number, id: number) {
    const income = await this.prisma.incomeEntry.findFirst({
      where: { id, userId },
    });
    if (!income) throw new NotFoundException(`Ingreso ${id} no encontrado`);
    return income;
  }

  /** Resumen del mes: totales por fuente, distribución y últimos 12 meses. */
  async summary(userId: number, month = currentMonth()) {
    const [incomes, buckets, history] = await Promise.all([
      this.listIncomes(userId, month),
      this.getPlan(userId, 'INCOME'),
      this.prisma.incomeEntry.groupBy({
        by: ['period'],
        where: { userId },
        _sum: { amount: true },
        orderBy: { period: 'desc' },
        take: 12,
      }),
    ]);

    const bySource = (Object.keys(IncomeSource) as IncomeSource[]).map(
      (source) => ({
        source,
        amount: round2(
          sum(incomes.filter((i) => i.source === source).map((i) => i.amount)),
        ),
      }),
    );
    const total = round2(sum(incomes.map((i) => i.amount)));

    return {
      month,
      total,
      bySource,
      incomes,
      distribution: allocate(total, buckets),
      history: history
        .map((h) => ({
          month: h.period.toISOString().slice(0, 7),
          total: round2(h._sum.amount ?? 0),
        }))
        .reverse(),
    };
  }

  // ─── Payouts ──────────────────────────────────

  async listPayouts(userId: number) {
    const payouts = await this.prisma.payout.findMany({
      where: { userId },
      orderBy: { receivedAt: 'desc' },
      include: {
        fundingAccount: { select: { id: true, firmName: true, label: true } },
      },
    });
    const totals = new Map<
      string,
      { key: string; label: string; amount: number }
    >();
    for (const p of payouts) {
      for (const a of p.allocation as unknown as (Bucket & {
        amount: number;
      })[]) {
        const prev = totals.get(a.key) ?? {
          key: a.key,
          label: a.label,
          amount: 0,
        };
        totals.set(a.key, { ...prev, amount: round2(prev.amount + a.amount) });
      }
    }
    return {
      items: payouts,
      total: round2(sum(payouts.map((p) => p.amount))),
      byBucket: [...totals.values()],
    };
  }

  async createPayout(userId: number, dto: CreatePayoutDto) {
    const buckets = dto.buckets ?? (await this.getPlan(userId, 'PAYOUT'));
    const error = validateBuckets(buckets);
    if (error) throw new BadRequestException(error);
    if (dto.fundingAccountId != null) {
      const account = await this.prisma.fundingAccount.findFirst({
        where: { id: dto.fundingAccountId, userId, deletedAt: null },
        select: { id: true },
      });
      if (!account)
        throw new BadRequestException('La cuenta de fondeo no existe');
    }
    return this.prisma.payout.create({
      data: {
        userId,
        amount: dto.amount,
        fundingAccountId: dto.fundingAccountId ?? null,
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
        note: dto.note ?? null,
        allocation: allocate(
          dto.amount,
          buckets,
        ) as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async removePayout(userId: number, id: number) {
    const payout = await this.prisma.payout.findFirst({
      where: { id, userId },
    });
    if (!payout) throw new NotFoundException(`Payout ${id} no encontrado`);
    await this.prisma.payout.delete({ where: { id } });
    return { id };
  }
}
