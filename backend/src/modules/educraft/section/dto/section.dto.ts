import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ObservationType } from '@prisma/client';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ScheduleDto {
  @IsInt()
  @Min(1)
  @Max(7)
  @ApiProperty({ description: '1 = lunes … 7 = domingo' })
  weekday!: number;

  @Matches(TIME, { message: 'Hora inválida (HH:MM)' })
  @ApiProperty({ example: '08:00' })
  startTime!: string;

  @Matches(TIME, { message: 'Hora inválida (HH:MM)' })
  @ApiProperty({ example: '09:30' })
  endTime!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @ApiProperty({ required: false })
  topic?: string;
}

export class CreateSectionDto {
  @IsInt()
  @ApiProperty()
  schoolYearId!: number;

  @IsInt()
  @ApiProperty()
  gradeId!: number;

  @IsString()
  @MaxLength(20)
  @ApiProperty({ example: 'A' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @ApiProperty({ required: false, default: 'Matemática' })
  subject?: string;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  @ApiProperty({ required: false, example: '#ec4899' })
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @ApiProperty({ required: false })
  room?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ScheduleDto)
  @ApiProperty({ required: false, type: [ScheduleDto] })
  schedules?: ScheduleDto[];
}

export class UpdateSectionDto extends PartialType(CreateSectionDto) {}

export class CreateStudentDto {
  @IsString()
  @MaxLength(100)
  @ApiProperty()
  firstName!: string;

  @IsString()
  @MaxLength(100)
  @ApiProperty()
  lastName!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiProperty({ required: false })
  listNumber?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @ApiProperty({ required: false })
  documentId?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  birthDate?: string;

  @IsOptional()
  @IsIn(['F', 'M'])
  @ApiProperty({ required: false, enum: ['F', 'M'] })
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @ApiProperty({ required: false })
  guardianName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @ApiProperty({ required: false })
  guardianPhone?: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({ required: false })
  guardianEmail?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Adecuaciones o situaciones particulares' })
  notes?: string;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false, description: 'Mover a otra sección del docente' })
  sectionId?: number;
}

export class ImportStudentsDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateStudentDto)
  @ApiProperty({ type: [CreateStudentDto] })
  students!: CreateStudentDto[];
}

export class CreateObservationDto {
  @IsEnum(ObservationType)
  @ApiProperty({ enum: ObservationType })
  type!: ObservationType;

  @IsString()
  @MaxLength(4000)
  @ApiProperty()
  content!: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  date?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  aiGenerated?: boolean;
}

export class CreateEvidenceDto {
  @IsString()
  @MaxLength(150)
  @ApiProperty()
  title!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Enlace externo (si no se sube archivo)' })
  url?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiProperty({ required: false })
  assessmentId?: number;
}
