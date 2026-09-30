import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { CalendarEventType } from '@prisma/client';

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
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}
