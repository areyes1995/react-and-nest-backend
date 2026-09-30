import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
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
import { Difficulty, EvaluationType, InstrumentType, QuestionType } from '@prisma/client';

export class CreateQuestionDto {
  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  gradeId?: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  fundamentalId?: number;

  @IsString()
  @MaxLength(200)
  @ApiProperty()
  topic!: string;

  @IsEnum(QuestionType)
  @ApiProperty({ enum: QuestionType })
  type!: QuestionType;

  @IsOptional()
  @IsEnum(Difficulty)
  @ApiProperty({ enum: Difficulty, required: false })
  difficulty?: Difficulty;

  @IsString()
  @MaxLength(4000)
  @ApiProperty()
  statement!: string;

  @IsOptional()
  @ApiProperty({ required: false, description: 'Opciones o pares para relacionar' })
  options?: unknown;

  @IsOptional()
  @ApiProperty({ required: false, description: 'Respuesta correcta' })
  answer?: unknown;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  solution?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ required: false, default: 1 })
  points?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ required: false, type: [String] })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  aiGenerated?: boolean;
}

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}

export class BulkQuestionsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  @ApiProperty({ type: [CreateQuestionDto] })
  questions!: CreateQuestionDto[];
}

export class ExamQuestionRefDto {
  @IsInt()
  @ApiProperty()
  questionId!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ required: false })
  points?: number;
}

export class CreateExamDto {
  @IsString()
  @MaxLength(200)
  @ApiProperty()
  title!: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  gradeId?: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  fundamentalId?: number;

  @IsOptional()
  @IsEnum(EvaluationType)
  @ApiProperty({ enum: EvaluationType, required: false })
  evaluationType?: EvaluationType;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  instructions?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @ApiProperty({ required: false })
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  @ApiProperty({ required: false, default: 1 })
  versions?: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  shuffle?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ExamQuestionRefDto)
  @ApiProperty({ required: false, type: [ExamQuestionRefDto] })
  questions?: ExamQuestionRefDto[];

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  aiGenerated?: boolean;
}

export class UpdateExamDto extends PartialType(CreateExamDto) {}

export class RandomExamDto {
  @IsString()
  @MaxLength(200)
  @ApiProperty()
  title!: string;

  @IsInt()
  @Min(1)
  @Max(60)
  @ApiProperty()
  count!: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Filtra por tema (contiene)' })
  topic?: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  gradeId?: number;

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
  @IsInt()
  @Min(1)
  @Max(6)
  @ApiProperty({ required: false, default: 1 })
  versions?: number;
}

export class CreateInstrumentDto {
  @IsEnum(InstrumentType)
  @ApiProperty({ enum: InstrumentType })
  type!: InstrumentType;

  @IsString()
  @MaxLength(200)
  @ApiProperty()
  title!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  description?: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  gradeId?: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  fundamentalId?: number;

  @IsObject()
  @ApiProperty({ description: 'Contenido del instrumento según su tipo' })
  content!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  aiGenerated?: boolean;
}

export class UpdateInstrumentDto extends PartialType(CreateInstrumentDto) {}
