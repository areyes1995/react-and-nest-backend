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
