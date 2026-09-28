import { AiAnalysis, Prisma } from '@prisma/client';
import { AiAnalysisQueryParametersDto } from 'modules/ai-analysis/dtos/ai-analysis-query-parameters.dto';
import { PrismaTx } from 'prisma/prisma.types';
import { PagedResultDto } from 'src/shared/dtos/paged-result.dto';

export interface AiAnalysisRepository {
  getAiAnalysisById(id: number): Promise<AiAnalysis | null>;
  getAiAnalysis(
    query: AiAnalysisQueryParametersDto,
    tx?: PrismaTx,
  ): Promise<PagedResultDto<AiAnalysis>>;
  getByInputHash(inputHash: string): Promise<AiAnalysis | null>;
  create(data: Prisma.AiAnalysisCreateInput): Promise<AiAnalysis>;
}
