// ──────────────────────────────────────────────
// Revisión de una decisión del estudiante.
// El cliente manda la situación, lo que hizo y lo que
// ya dijo el motor. La IA no recalcula matemáticas:
// las recibe hechas y aporta lo que el motor no sabe
// dar — el porqué, en lenguaje de profesor.
// ──────────────────────────────────────────────

import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { TableSnapshotDto } from './table-snapshot.dto';

export const VERDICTS = ['good', 'ok', 'mistake'] as const;
export type ReviewVerdict = (typeof VERDICTS)[number];

export class EngineAnalysisDto {
  @IsIn(VERDICTS) verdict: ReviewVerdict;

  /** Equity del estudiante en el momento de decidir (0..1). */
  @IsNumber() @Min(0) @Max(1) equity: number;

  /** Equity mínima que exigían las pot odds (0..1). */
  @IsNumber() @Min(0) @Max(1) required: number;

  /** Acción que el motor considera mejor. */
  @IsString() @MaxLength(10) recommended: string;

  /** Explicación del motor, ya redactada. */
  @IsOptional() @IsString() @MaxLength(400) message?: string;

  /** Puntuación de Chen de la mano inicial. */
  @IsOptional() @IsInt() chen?: number;
}

export class ReviewedActionDto {
  @IsIn(['fold', 'check', 'call', 'bet', 'raise']) type: string;
  @IsOptional() @IsInt() @Min(0) amount?: number;
}

export class DecisionReviewDto {
  /** La situación tal y como estaba ANTES de actuar. */
  @ValidateNested() @Type(() => TableSnapshotDto) snapshot: TableSnapshotDto;

  @ValidateNested() @Type(() => ReviewedActionDto) action: ReviewedActionDto;

  @ValidateNested() @Type(() => EngineAnalysisDto) engine: EngineAnalysisDto;

  /** Qué se está entrenando, para que la corrección vaya al grano. */
  @IsOptional() @IsString() @MaxLength(200) focus?: string;

  /** Veredicto del entrenamiento concreto, si lo hubo. */
  @IsOptional() @IsString() @MaxLength(400) drillMessage?: string;
}

export interface DecisionReviewResult {
  /** `ai` si revisó el modelo; `engine` si la IA está apagada o falló. */
  source: 'ai' | 'engine';
  verdict: ReviewVerdict;
  /** Titular corto: "Fold correcto", "Te faltó valor"… */
  headline?: string;
  /** Explicación didáctica, dos o tres frases. */
  explanation?: string;
  /** Qué hacer la próxima vez en esta misma situación. */
  suggestion?: string;
  model?: string;
  provider?: string;
  latencyMs?: number;
  error?: string;
}
