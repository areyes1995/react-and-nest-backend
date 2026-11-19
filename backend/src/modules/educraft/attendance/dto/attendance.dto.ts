import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

/** Motivos habituales de justificación (se pueden ampliar sin tocar el enum). */
export const JUSTIFICATION_REASONS = [
  'ENFERMEDAD',
  'CITA_MEDICA',
  'FAMILIAR',
  'CLIMA',
  'TRANSPORTE',
  'ACTIVIDAD_ESCOLAR',
  'OTRO',
] as const;

export class AttendanceEntryDto {
  @IsInt()
  @ApiProperty()
  studentId!: number;

  @IsEnum(AttendanceStatus)
  @ApiProperty({ enum: AttendanceStatus })
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ required: false })
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @ApiProperty({ required: false, enum: JUSTIFICATION_REASONS })
  justificationReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiProperty({ required: false })
  justificationNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiProperty({
    required: false,
    description: 'Referencia al soporte (URL o clave de almacenamiento)',
  })
  justificationAttachment?: string;
}

export class SaveAttendanceDto {
  @IsInt()
  @ApiProperty()
  sectionId!: number;

  @IsDateString()
  @ApiProperty({ example: '2025-05-15' })
  date!: string;

  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  @ApiProperty({ type: [AttendanceEntryDto] })
  entries!: AttendanceEntryDto[];
}

export class JustifyAttendanceDto {
  @IsInt()
  @ApiProperty()
  sectionId!: number;

  @IsDateString()
  @ApiProperty({ example: '2025-05-15' })
  date!: string;

  @IsInt()
  @ApiProperty()
  studentId!: number;

  @IsString()
  @MaxLength(60)
  @ApiProperty({ enum: JUSTIFICATION_REASONS })
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiProperty({ required: false })
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiProperty({ required: false })
  attachment?: string;
}

/** Parámetros de la ruta DELETE /attendance (query string). */
export class RevertAttendanceDto {
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  sectionId!: number;

  @IsDateString()
  @ApiProperty({ example: '2025-05-15' })
  date!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiProperty({
    required: false,
    description: 'Si se omite se revierte el día completo',
  })
  studentId?: number;
}

export class AttendanceHistoryDto {
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  sectionId!: number;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  from?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiProperty({ required: false })
  studentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiProperty({
    required: false,
    description: 'Máximo de registros (por defecto 200)',
  })
  limit?: number;
}
