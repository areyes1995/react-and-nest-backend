// modules/ai-analysis/dtos/ai-analysis.dto.ts
import { AiAnalysisStatus, AiAnalysisType } from '@prisma/client';

export class AiAnalysisDto {
  id: number;

  analysisType: AiAnalysisType;
  analyzedById: number | null;

  provider: string | null;
  model: string;
  modelVersion: string | null;
  promptVersion: string | null;

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

  constructor(partial: Partial<AiAnalysisDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(entity: any): AiAnalysisDto {
    return new AiAnalysisDto({
      id: entity.id,

      analysisType: entity.analysisType,
      analyzedById: entity.analyzedById ?? null,

      provider: entity.provider ?? null,
      model: entity.model,
      modelVersion: entity.modelVersion ?? null,
      promptVersion: entity.promptVersion ?? null,

      inputHash: entity.inputHash ?? null,

      promptTokens: entity.promptTokens ?? null,
      completionTokens: entity.completionTokens ?? null,
      totalTokens: entity.totalTokens ?? null,
      estimatedCost: entity.estimatedCost?.toString() ?? null,
      processingTimeMs: entity.processingTimeMs ?? null,

      status: entity.status,
      errorMessage: entity.errorMessage ?? null,
      startedAt: entity.startedAt ?? null,
      completedAt: entity.completedAt ?? null,
      createdAt: entity.createdAt,
    });
  }
}
