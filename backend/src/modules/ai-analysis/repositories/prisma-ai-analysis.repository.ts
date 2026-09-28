import { Prisma, AiAnalysis } from '@prisma/client';
import { AiAnalysisRepository } from './interfaces/ai-analysis.repository';
import { PrismaService } from 'prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { AiAnalysisQueryParametersDto } from '../dtos/ai-analysis-query-parameters.dto';
import { PagedResultDto } from 'src/shared/dtos/paged-result.dto';
import { PrismaTx } from 'prisma/prisma.types';
import { paginatePrisma } from 'src/shared/helpers/prisma-pagination.helper';

@Injectable()
export class PrismaAiAnalysisRepository implements AiAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAiAnalysisById(id: number): Promise<AiAnalysis | null> {
    return await this.prisma.aiAnalysis.findFirst({
      where: { id },
      include: {
        analyzedBy: true,
      },
    });
  }

  async getAiAnalysis(
    query: AiAnalysisQueryParametersDto,
    tx?: PrismaTx,
  ): Promise<PagedResultDto<AiAnalysis>> {
    const prismaClient = tx ?? this.prisma;

    return paginatePrisma<
      Prisma.AiAnalysisWhereInput,
      Prisma.AiAnalysisFindManyArgs,
      AiAnalysis
    >({
      count: (args) => prismaClient.aiAnalysis.count(args),
      findMany: (args) => prismaClient.aiAnalysis.findMany(args),
      where: {},
      findManyArgs: {
        orderBy: { createdAt: 'desc' },
        include: { analyzedBy: true },
      },
      query,
      filterConfig: {
        id: 'number',
        status: 'enum',
        analysisType: 'enum',
      },
    });
  }

  async getByInputHash(inputHash: string): Promise<AiAnalysis | null> {
    return this.prisma.aiAnalysis.findFirst({
      where: { inputHash },
      include: { analyzedBy: true },
    });
  }

  async create(data: Prisma.AiAnalysisCreateInput): Promise<AiAnalysis> {
    return this.prisma.aiAnalysis.create({
      data,
      include: { analyzedBy: true },
    });
  }
}