import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ActivityType, Difficulty, ObservationType, QuestionType } from '@prisma/client';

export class GenerateLessonPlanDto {
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  gradeId!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @ApiProperty({ example: 'Función cuadrática' })
  topic!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiProperty({ required: false })
  sectionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiProperty({ required: false })
  unitId?: number;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(240)
  @ApiProperty({ required: false, default: 45 })
  durationMinutes?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ApiProperty({ required: false, type: [Number] })
  specificCompetenceIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ApiProperty({ required: false, type: [Number] })
  indicatorIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ApiProperty({ required: false, type: [Number] })
  contentIds?: number[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ required: false, type: [String] })
  strategies?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiProperty({ required: false, description: 'Contexto (salud, finanzas, medio ambiente…)' })
  context?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: 'Guardar directamente el plan' })
  save?: boolean;
}

export class GenerateProblemsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @ApiProperty()
  topic!: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  gradeId?: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  fundamentalId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiProperty({ required: false })
  context?: string;

  @IsOptional()
  @IsEnum(Difficulty)
  @ApiProperty({ required: false, enum: Difficulty })
  difficulty?: Difficulty;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @ApiProperty({ required: false, default: 3 })
  count?: number;
}

export class StepByStepDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  @ApiProperty({ example: '2x + 5 = 13' })
  expression!: string;
}

export class GenerateInstrumentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @ApiProperty()
  topic!: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  gradeId?: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  fundamentalId?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(6)
  @ApiProperty({ required: false, default: 4 })
  criteriaCount?: number;

  @IsOptional()
  @IsIn(['1-4', '1-5', 'AD-A-B-C'])
  @ApiProperty({ required: false, enum: ['1-4', '1-5', 'AD-A-B-C'] })
  scale?: '1-4' | '1-5' | 'AD-A-B-C';

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  save?: boolean;
}

export class GenerateExamDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @ApiProperty()
  topic!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiProperty({ required: false })
  title?: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  gradeId?: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  fundamentalId?: number;

  @IsInt()
  @Min(1)
  @Max(30)
  @ApiProperty({ default: 8 })
  count!: number;

  @IsOptional()
  @IsArray()
  @IsEnum(QuestionType, { each: true })
  @ApiProperty({ required: false, enum: QuestionType, isArray: true })
  types?: QuestionType[];

  @IsOptional()
  @IsEnum(Difficulty)
  @ApiProperty({ required: false, enum: Difficulty })
  difficulty?: Difficulty;

  @IsOptional()
  @IsIn(['DIAGNOSTIC', 'FORMATIVE', 'SUMMATIVE'])
  @ApiProperty({ required: false })
  evaluationType?: 'DIAGNOSTIC' | 'FORMATIVE' | 'SUMMATIVE';

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: 'Guardar preguntas en el banco y crear el examen' })
  save?: boolean;
}

export class GenerateActivityDto {
  @IsEnum(ActivityType)
  @ApiProperty({ enum: ActivityType })
  type!: ActivityType;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @ApiProperty()
  topic!: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  gradeId?: number;

  @IsOptional()
  @IsEnum(Difficulty)
  @ApiProperty({ required: false, enum: Difficulty })
  difficulty?: Difficulty;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  save?: boolean;
}

export class GenerateObservationDto {
  @IsInt()
  @ApiProperty()
  studentId!: number;

  @IsEnum(ObservationType)
  @ApiProperty({ enum: ObservationType })
  type!: ObservationType;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  save?: boolean;
}

export class GenerateStrategiesDto {
  @IsInt()
  @ApiProperty()
  sectionId!: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ApiProperty({ required: false, type: [Number] })
  studentIds?: number[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiProperty({ required: false })
  topic?: string;
}

export class GeneratePresentationDto {
  @IsInt()
  @ApiProperty()
  lessonPlanId!: number;
}

export class GenerateProgramDto {
  @IsInt()
  @ApiProperty()
  gradeId!: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  schoolYearId?: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  sectionId?: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  save?: boolean;
}

export class TutorMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  @ApiProperty()
  message!: string;
}

export class QuickCommandDto {
  @IsIn(['PROBLEM_OF_DAY', 'ACTIVE_BREAK', 'EXIT_TICKET'])
  @ApiProperty({ enum: ['PROBLEM_OF_DAY', 'ACTIVE_BREAK', 'EXIT_TICKET'] })
  command!: 'PROBLEM_OF_DAY' | 'ACTIVE_BREAK' | 'EXIT_TICKET';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiProperty({ required: false })
  topic?: string;
}

export class DocumentToSessionDto {
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  gradeId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(60000)
  @ApiProperty({ required: false, description: 'Texto del documento (si no se sube archivo)' })
  text?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiProperty({ required: false })
  durationMinutes?: number;
}
