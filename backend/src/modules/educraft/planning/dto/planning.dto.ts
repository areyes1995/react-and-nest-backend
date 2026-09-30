import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ActivityType, LessonPlanStatus, UnitKind } from '@prisma/client';

export const MOMENTS = ['INICIO', 'DESARROLLO', 'CIERRE'] as const;
export type MomentName = (typeof MOMENTS)[number];

export class CurriculumLinksDto {
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
}

export class CreateUnitDto extends CurriculumLinksDto {
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
  @IsEnum(UnitKind)
  @ApiProperty({ enum: UnitKind, required: false })
  kind?: UnitKind;

  @IsString()
  @MaxLength(200)
  @ApiProperty()
  title!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  description?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  endDate?: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  order?: number;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  @ApiProperty({ required: false })
  color?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ required: false, type: [String] })
  evaluationCriteria?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ required: false, type: [String] })
  evidences?: string[];

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  aiGenerated?: boolean;
}

export class UpdateUnitDto extends PartialType(CreateUnitDto) {}

export class LessonMomentDto {
  @IsIn(MOMENTS)
  @ApiProperty({ enum: MOMENTS })
  moment!: MomentName;

  @IsInt()
  @Min(0)
  @Max(600)
  @ApiProperty()
  minutes!: number;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  activities!: string[];

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  metacognition?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ required: false, type: [String] })
  evidences?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ required: false, type: [String] })
  techniques?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ required: false, type: [String] })
  resources?: string[];
}

export class CreateLessonPlanDto extends CurriculumLinksDto {
  @IsInt()
  @ApiProperty()
  gradeId!: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  sectionId?: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  unitId?: number;

  @IsString()
  @MaxLength(200)
  @ApiProperty()
  title!: string;

  @IsString()
  @MaxLength(200)
  @ApiProperty()
  topic!: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(600)
  @ApiProperty({ required: false, default: 45 })
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  purpose?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ required: false, type: [String] })
  strategies?: string[];

  @IsOptional()
  @IsEnum(LessonPlanStatus)
  @ApiProperty({ enum: LessonPlanStatus, required: false })
  status?: LessonPlanStatus;

  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => LessonMomentDto)
  @ApiProperty({ type: [LessonMomentDto] })
  moments!: LessonMomentDto[];

  @IsOptional()
  @IsObject()
  @ApiProperty({ required: false })
  evaluation?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  assignment?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  aiGenerated?: boolean;
}

export class UpdateLessonPlanDto extends PartialType(CreateLessonPlanDto) {}

export class CreatePresentationDto {
  @IsString()
  @MaxLength(200)
  @ApiProperty()
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiProperty({ required: false })
  subtitle?: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  lessonPlanId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @ApiProperty({ required: false, default: 'pastel' })
  theme?: string;

  @IsArray()
  @ArrayMaxSize(80)
  @IsObject({ each: true })
  @ApiProperty({ description: 'Diapositivas: [{ id, layout, title, blocks: [...] }]' })
  slides!: Record<string, unknown>[];

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  aiGenerated?: boolean;
}

export class UpdatePresentationDto extends PartialType(CreatePresentationDto) {}

export class CreateActivityDto {
  @IsEnum(ActivityType)
  @ApiProperty({ enum: ActivityType })
  type!: ActivityType;

  @IsString()
  @MaxLength(200)
  @ApiProperty()
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiProperty({ required: false })
  topic?: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  gradeId?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  instructions?: string;

  @IsObject()
  @ApiProperty({ description: 'Contenido según el tipo (preguntas, pares, pasos, casillas…)' })
  content!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  aiGenerated?: boolean;
}

export class UpdateActivityDto extends PartialType(CreateActivityDto) {}
