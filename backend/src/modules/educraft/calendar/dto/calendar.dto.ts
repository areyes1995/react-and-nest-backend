import { ApiProperty, PartialType } from '@nestjs/swagger';
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
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CalendarEventType } from '@prisma/client';
import { RECURRENCE_FREQS, type RecurrenceFreq } from '../calendar.util';

export class CreateEventDto {
  @IsEnum(CalendarEventType)
  @ApiProperty({ enum: CalendarEventType })
  type!: CalendarEventType;

  @IsString()
  @MaxLength(200)
  @ApiProperty()
  title!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  description?: string;

  @IsDateString()
  @ApiProperty({ example: '2025-05-15T11:00:00.000Z' })
  startAt!: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  endAt?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  allDay?: boolean;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  sectionId?: number;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  @ApiProperty({ required: false })
  color?: string;

  @IsOptional()
  @IsIn(RECURRENCE_FREQS)
  @ApiProperty({ required: false, enum: RECURRENCE_FREQS })
  recurrenceFreq?: RecurrenceFreq | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  @ApiProperty({ required: false, minimum: 1, maximum: 365 })
  recurrenceInterval?: number;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    required: false,
    description: 'Última fecha de la serie (YYYY-MM-DD)',
  })
  recurrenceUntil?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @ApiProperty({ required: false, description: 'Número máximo de ocurrencias' })
  recurrenceCount?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ApiProperty({
    required: false,
    description: 'Días ISO 1=lunes…7=domingo para recurrencias semanales',
  })
  recurrenceByWeekday?: number[];
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class CalendarExportDto {
  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  from?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  to?: string;
}
