import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TradingProfile } from '@prisma/client';
import { UpdateTradingProfileDto } from '../dto/trading.dto';
import { evaluateRisk, RiskStatus } from '../domain/risk-status';

@Injectable()
export class TradingProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /** El perfil se crea con valores conservadores la primera vez que se pide. */
  async get(userId: number): Promise<TradingProfile> {
    return this.prisma.tradingProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async update(
    userId: number,
    dto: UpdateTradingProfileDto,
  ): Promise<TradingProfile> {
    return this.prisma.tradingProfile.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
  }

  /** Estado de alertas de la cuenta personal (operaciones sin cuenta de fondeo). */
  async riskStatus(
    userId: number,
    tzOffset = 0,
    now = new Date(),
  ): Promise<RiskStatus> {
    const profile = await this.get(userId);
    const trades = await this.prisma.tradeEntry.findMany({
      where: { userId, fundingAccountId: null, deletedAt: null },
      select: { id: true, tradeDate: true, resultAmount: true },
    });
    return evaluateRisk(profile, trades, now, tzOffset);
  }
}
