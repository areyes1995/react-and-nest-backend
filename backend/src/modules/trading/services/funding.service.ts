import { Injectable, NotFoundException } from '@nestjs/common';
import { FundingAccount } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreateFundingAccountDto,
  UpdateFundingAccountDto,
} from '../dto/trading.dto';
import { evaluateFunding, FundingStatusResult } from '../domain/funding-status';

export type FundingAccountWithStatus = FundingAccount & {
  summary: FundingStatusResult;
};

@Injectable()
export class FundingService {
  constructor(private readonly prisma: PrismaService) {}

  private async withStatus(
    accounts: FundingAccount[],
    tzOffset: number,
    now = new Date(),
  ): Promise<FundingAccountWithStatus[]> {
    if (!accounts.length) return [];
    const trades = await this.prisma.tradeEntry.findMany({
      where: {
        fundingAccountId: { in: accounts.map((a) => a.id) },
        deletedAt: null,
      },
      select: {
        id: true,
        fundingAccountId: true,
        tradeDate: true,
        resultAmount: true,
      },
    });
    return accounts.map((a) => ({
      ...a,
      summary: evaluateFunding(
        a,
        trades.filter((t) => t.fundingAccountId === a.id),
        now,
        tzOffset,
      ),
    }));
  }

  async list(
    userId: number,
    tzOffset = 0,
  ): Promise<FundingAccountWithStatus[]> {
    const accounts = await this.prisma.fundingAccount.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return this.withStatus(accounts, tzOffset);
  }

  async get(
    userId: number,
    id: number,
    tzOffset = 0,
  ): Promise<FundingAccountWithStatus> {
    const account = await this.prisma.fundingAccount.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!account)
      throw new NotFoundException(`Cuenta de fondeo ${id} no encontrada`);
    const [withStatus] = await this.withStatus([account], tzOffset);
    return withStatus;
  }

  async create(userId: number, dto: CreateFundingAccountDto) {
    return this.prisma.fundingAccount.create({
      data: {
        ...dto,
        ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
        userId,
      },
    });
  }

  async update(userId: number, id: number, dto: UpdateFundingAccountDto) {
    await this.get(userId, id);
    return this.prisma.fundingAccount.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
      },
    });
  }

  async remove(userId: number, id: number) {
    await this.get(userId, id);
    await this.prisma.fundingAccount.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }
}
