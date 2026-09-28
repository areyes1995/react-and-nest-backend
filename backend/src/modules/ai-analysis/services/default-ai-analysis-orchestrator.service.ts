import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AiAnalysisOrchestratorService } from './interfaces/ai-analysis-orchestrator.service';
import { RunAiAnalysisParams } from '../dtos/run-ai-analysis-params.dto';
import { RunAiAnalysisResult } from '../dtos/run-ai-analysis-result.dto';
import { AiAnalysisDto } from '../dtos/ai-analysis.dto';
import { AiAnalysisRepository } from '../repositories/interfaces/ai-analysis.repository';
import { AiProviderService } from '../providers/interfaces/ai-provider.service';
import { AiAnalysisQueryParametersDto } from '../dtos/ai-analysis-query-parameters.dto';
import { PagedResultDto } from 'src/shared/dtos/paged-result.dto';

@Injectable()
export class DefaultAiAnalysisOrchestratorService implements AiAnalysisOrchestratorService {
  constructor(
    @Inject('AiAnalysisRepository')
    private readonly aiAnalysisRepository: AiAnalysisRepository,
    @Inject('AiProviderService')
    private readonly aiProviderService: AiProviderService,
  ) {}

  async getAiAnalysisById(id: number): Promise<AiAnalysisDto> {
    const analysis = await this.aiAnalysisRepository.getAiAnalysisById(id);

    if (!analysis) {
      throw new NotFoundException(`AI Analysis with ID ${id} not found.`);
    }

    return AiAnalysisDto.fromEntity(analysis);
  }

  async getAiAnalysis(
    query: AiAnalysisQueryParametersDto,
  ): Promise<PagedResultDto<AiAnalysisDto>> {
    const pagedResult = await this.aiAnalysisRepository.getAiAnalysis(query);

    return {
      items: pagedResult.items.map((item) => AiAnalysisDto.fromEntity(item)),
      totalItems: pagedResult.totalItems,
      page: pagedResult.page,
      pageSize: pagedResult.pageSize,
      totalPages: pagedResult.totalPages,
    };
  }

  async run<T>(
    params: RunAiAnalysisParams<T>,
  ): Promise<RunAiAnalysisResult<T>> {
    const existing = await this.aiAnalysisRepository.getByInputHash(
      params.inputHash,
    );

    if (existing) {
      return {
        analysis: AiAnalysisDto.fromEntity(existing),
        response: existing.response as T,
        cached: true,
      };
    }

    const aiResponse = await this.aiProviderService.analyze<T>(
      params.prompt,
      params.schema,
    );

    const analysis = await this.aiAnalysisRepository.create({
      ...(params.projectId != null
        ? { projectId: BigInt(params.projectId) }
        : {}),
      analysisType: params.analysisType,
      analyzedBy: params.analyzedById
        ? { connect: { id: params.analyzedById } }
        : undefined,

      provider: aiResponse.metadata.provider,
      model: aiResponse.metadata.model,
      modelVersion: aiResponse.metadata.modelVersion ?? null,
      promptVersion: params.promptVersion ?? 'v1',

      prompt: {
        systemInstructions: params.prompt.systemInstructions,
        userPrompt: params.prompt.userPrompt,
      },
      response: JSON.parse(JSON.stringify(aiResponse.data)),
      inputHash: params.inputHash,

      promptTokens: aiResponse.metadata.tokens.prompt ?? null,
      completionTokens: aiResponse.metadata.tokens.completion ?? null,
      totalTokens: aiResponse.metadata.tokens.total ?? null,
      processingTimeMs: aiResponse.metadata.processingTimeMs ?? null,

      status: 'COMPLETED',
      completedAt: new Date(),
    });

    return {
      analysis: AiAnalysisDto.fromEntity(analysis),
      response: aiResponse.data,
      cached: false,
    };
  }
}
