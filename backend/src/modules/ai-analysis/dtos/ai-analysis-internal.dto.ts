// modules/ai-analysis/dtos/ai-analysis-internal.dto.ts
import { AiAnalysisStatus, AiAnalysisType } from '@prisma/client';
import { SystemUserDto } from 'modules/system-user/dto/system-user.dto';

export class AiAnalysisInternalDto {
  id: number;

  analysisType: AiAnalysisType;
  analyzedById: number | null;
  analyzedBy: SystemUserDto | null;

  provider: string | null;
  model: string;
  modelVersion: string | null;
  promptVersion: string | null;

  prompt: Record<string, unknown>;
  response: Record<string, unknown>;
  inputHash: string | null;

  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  estimatedCost: string | null;
  processingTimeMs: number | null;

  status: AiAnalysisStatus;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;

  constructor(partial: Partial<AiAnalysisInternalDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(entity: any): AiAnalysisInternalDto {
    return new AiAnalysisInternalDto({
      id: entity.id,
      analysisType: entity.analysisType,
      analyzedById: entity.analyzedById,
      analyzedBy: entity.analyzedBy
        ? SystemUserDto.fromEntity(entity.analyzedBy)
        : null,
      provider: entity.provider,
      model: entity.model,
      modelVersion: entity.modelVersion,
      promptVersion: entity.promptVersion,
      prompt: entity.prompt,
      response: entity.response,
      inputHash: entity.inputHash,
      promptTokens: entity.promptTokens,
      completionTokens: entity.completionTokens,
      totalTokens: entity.totalTokens,
      estimatedCost: entity.estimatedCost?.toString() ?? null,
      processingTimeMs: entity.processingTimeMs,
      status: entity.status,
      errorMessage: entity.errorMessage,
      startedAt: entity.startedAt,
      completedAt: entity.completedAt,
      createdAt: entity.createdAt,
    });
  }
}