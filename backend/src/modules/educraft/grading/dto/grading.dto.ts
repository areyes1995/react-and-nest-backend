import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EvaluationType } from '@prisma/client';

export class GradeEntryDto {
  @IsInt()
  @ApiProperty()
  studentId!: number;

  @IsInt()
  @Min(1)
  @Max(4)
  @ApiProperty()
  period!: number;

  @IsInt()
  @Min(1)
  @Max(4)
  @ApiProperty({ description: 'Bloque de competencias PC1…PC4' })
  block!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ required: false, nullable: true })
  score?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ required: false, nullable: true })
  recovery?: number | null;
}

export class SaveGradesDto {
  @IsArray()
  @ArrayMaxSize(4000)
  @ValidateNested({ each: true })
  @Type(() => GradeEntryDto)
  @ApiProperty({ type: [GradeEntryDto] })
  entries!: GradeEntryDto[];
}

export class FinalEntryDto {
  @IsInt()
  @ApiProperty()
  studentId!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ required: false, nullable: true })
  completiveScore?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ required: false, nullable: true })
  extraordinaryScore?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ required: false, nullable: true })
  specialScore?: number | null;
}

export class SaveFinalGradesDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => FinalEntryDto)
  @ApiProperty({ type: [FinalEntryDto] })
  entries!: FinalEntryDto[];
}

export class CreateAssessmentDto {
  @IsInt()
  @ApiProperty()
  sectionId!: number;

  @IsString()
  @MaxLength(150)
  @ApiProperty()
  title!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  description?: string;

  @IsOptional()
  @IsEnum(EvaluationType)
  @ApiProperty({ enum: EvaluationType, required: false })
  type?: EvaluationType;

  @IsInt()
  @Min(1)
  @Max(4)
  @ApiProperty()
  period!: number;

  @IsInt()
  @Min(1)
  @Max(4)
  @ApiProperty()
  block!: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  fundamentalId?: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  instrumentId?: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  examId?: number;

  @IsDateString()
  @ApiProperty()
  date!: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiProperty({ required: false, default: 100 })
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ required: false, default: 1 })
  weight?: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  requiresDelivery?: boolean;
}

export class UpdateAssessmentDto extends PartialType(CreateAssessmentDto) {}

export class ScoreEntryDto {
  @IsInt()
  @ApiProperty()
  studentId!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ required: false, nullable: true })
  score?: number | null;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  delivered?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiProperty({ required: false })
  feedback?: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({ required: false, description: 'Respuestas del instrumento de evaluación' })
  instrumentData?: Record<string, unknown>;
}

export class SaveScoresDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ScoreEntryDto)
  @ApiProperty({ type: [ScoreEntryDto] })
  entries!: ScoreEntryDto[];
}
