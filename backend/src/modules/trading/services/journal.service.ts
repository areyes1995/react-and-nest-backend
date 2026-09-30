import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TradeEntry } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreateTradeDto,
  TradeQueryDto,
  UpdateTradeDto,
} from '../dto/trading.dto';
import { computeJournalStats, JournalStats } from '../domain/journal-stats';
import { round2, round4 } from '../domain/time.util';
import { TradingProfileService } from './trading-profile.service';

@Injectable()
export class JournalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: TradingProfileService,
  ) {}

  private where(
    userId: number,
    query: TradeQueryDto,
  ): Prisma.TradeEntryWhereInput {
    const where: Prisma.TradeEntryWhereInput = { userId, deletedAt: null };
    if (query.account === 'personal') where.fundingAccountId = null;
    else if (query.account && query.account !== 'all')
      where.fundingAccountId = Number(query.account);
    if (query.from || query.to) {
      where.tradeDate = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }
    return where;
  }

  async list(userId: number, query: TradeQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const where = this.where(userId, query);
    const [items, totalItems] = await Promise.all([
      this.prisma.tradeEntry.findMany({
        where,
        orderBy: { tradeDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          fundingAccount: { select: { id: true, firmName: true, label: true } },
        },
      }),
      this.prisma.tradeEntry.count({ where }),
    ]);
    return {
      items,
      totalItems,
      page,
      pageSize,
      totalPages: Math.ceil(totalItems / pageSize) || 1,
    };
  }

  async getById(userId: number, id: number): Promise<TradeEntry> {
    const trade = await this.prisma.tradeEntry.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!trade) throw new NotFoundException(`Operación ${id} no encontrada`);
    return trade;
  }

  private async assertAccount(
    userId: number,
    fundingAccountId?: number | null,
  ) {
    if (fundingAccountId == null) return;
    const account = await this.prisma.fundingAccount.findFirst({
      where: { id: fundingAccountId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!account)
      throw new BadRequestException('La cuenta de fondeo no existe');
  }

  /**
   * Completa lo que falte entre riesgo en %, riesgo en dinero (sobre el
   * capital base de la cuenta) y resultado en R. Un campo `null` se deriva.
   */
  private async derive(
    userId: number,
    data: {
      fundingAccountId?: number | null;
      riskPct?: number | null;
      riskAmount?: number | null;
      resultAmount: number;
      resultR?: number | null;
    },
  ) {
    const base = await this.accountBase(userId, data.fundingAccountId);
    let riskPct = data.riskPct ?? null;
    let riskAmount = data.riskAmount ?? null;
    if (riskAmount == null && riskPct != null && base > 0) {
      riskAmount = round2((base * riskPct) / 100);
    }
    if (riskPct == null && riskAmount != null && base > 0) {
      riskPct = round4((riskAmount / base) * 100);
    }
    let resultR = data.resultR ?? null;
    if (resultR == null && riskAmount) {
      resultR = round2(data.resultAmount / riskAmount);
    }
    return { riskPct, riskAmount, resultR };
  }

  private async accountBase(
    userId: number,
    fundingAccountId?: number | null,
  ): Promise<number> {
    if (fundingAccountId == null)
      return (await this.profiles.get(userId)).initialCapital;
    const account = await this.prisma.fundingAccount.findFirst({
      where: { id: fundingAccountId, userId },
      select: { accountSize: true },
    });
    return account?.accountSize ?? 0;
  }

  async create(userId: number, dto: CreateTradeDto): Promise<TradeEntry> {
    await this.assertAccount(userId, dto.fundingAccountId);
    const derived = await this.derive(userId, dto);
    return this.prisma.tradeEntry.create({
      data: {
        ...dto,
        ...derived,
        asset: dto.asset.trim().toUpperCase(),
        tradeDate: new Date(dto.tradeDate),
        userId,
      },
    });
  }

  async update(
    userId: number,
    id: number,
    dto: UpdateTradeDto,
  ): Promise<TradeEntry> {
    const current = await this.getById(userId, id);
    await this.assertAccount(userId, dto.fundingAccountId);
    const touched = (k: keyof UpdateTradeDto) => dto[k] !== undefined;
    const riskChanged =
      touched('riskPct') ||
      touched('riskAmount') ||
      touched('fundingAccountId');
    // Lo que el usuario no envía pero depende de lo que sí cambió se recalcula.
    const derived = await this.derive(userId, {
      fundingAccountId: touched('fundingAccountId')
        ? dto.fundingAccountId
        : current.fundingAccountId,
      riskPct: touched('riskPct')
        ? dto.riskPct
        : riskChanged
          ? null
          : current.riskPct,
      riskAmount: touched('riskAmount')
        ? dto.riskAmount
        : riskChanged
          ? null
          : current.riskAmount,
      resultAmount: dto.resultAmount ?? current.resultAmount,
      resultR: touched('resultR')
        ? dto.resultR
        : riskChanged || touched('resultAmount')
          ? null
          : current.resultR,
    });
    return this.prisma.tradeEntry.update({
      where: { id },
      data: {
        ...dto,
        ...derived,
        ...(dto.asset ? { asset: dto.asset.trim().toUpperCase() } : {}),
        ...(dto.tradeDate ? { tradeDate: new Date(dto.tradeDate) } : {}),
      },
    });
  }

  async remove(userId: number, id: number) {
    await this.getById(userId, id);
    await this.prisma.tradeEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }

  async stats(userId: number, query: TradeQueryDto): Promise<JournalStats> {
    const trades = await this.prisma.tradeEntry.findMany({
      where: this.where(userId, query),
    });
    const startingCapital = await this.startingCapital(userId, query.account);
    return computeJournalStats(trades, startingCapital, query.tzOffset ?? 0);
  }

  private async startingCapital(
    userId: number,
    account?: string,
  ): Promise<number> {
    if (account && account !== 'personal' && account !== 'all') {
      const acc = await this.prisma.fundingAccount.findFirst({
        where: { id: Number(account), userId },
        select: { accountSize: true },
      });
      return acc?.accountSize ?? 0;
    }
    const profile = await this.profiles.get(userId);
    if (account === 'personal') return profile.initialCapital;
    const accounts = await this.prisma.fundingAccount.aggregate({
      where: { userId, deletedAt: null },
      _sum: { accountSize: true },
    });
    return profile.initialCapital + (accounts._sum.accountSize ?? 0);
  }
}
