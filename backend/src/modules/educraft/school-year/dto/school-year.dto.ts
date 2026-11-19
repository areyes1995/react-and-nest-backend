import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
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
import {
  GRADING_SCALE_TYPES,
  type GradingScaleType,
} from '../../shared/grading.calculator';

export class GradingScaleDto {
  @IsIn(GRADING_SCALE_TYPES)
  @ApiProperty({
    enum: GRADING_SCALE_TYPES,
    description:
      'Escala declarada; las notas se normalizan a 0-100 en el modelo interno.',
  })
  type!: GradingScaleType;

  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({
    default: 70,
    description:
      'Nota mínima expresada en la escala declarada (70 en 0-100, 3 en 1-5…).',
  })
  passing!: number;
}

export class PeriodDto {
  @IsInt()
  @Min(1)
  @Max(4)
  @ApiProperty()
  number!: number;

  @IsString()
  @MaxLength(40)
  @ApiProperty()
  name!: string;

  @IsDateString()
  @ApiProperty({ example: '2025-08-25' })
  startDate!: string;

  @IsDateString()
  @ApiProperty({ example: '2025-10-31' })
  endDate!: string;
}

export class CreateSchoolYearDto {
  @IsString()
  @MaxLength(40)
  @ApiProperty({ example: '2025-2026' })
  name!: string;

  @IsDateString()
  @ApiProperty({ example: '2025-08-25' })
  startDate!: string;

  @IsDateString()
  @ApiProperty({ example: '2026-06-19' })
  endDate!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  @ApiProperty({ required: false })
  teachingWeeks?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => GradingScaleDto)
  @ApiProperty({ required: false, type: GradingScaleDto })
  gradingScale?: GradingScaleDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => PeriodDto)
  @ApiProperty({
    required: false,
    type: [PeriodDto],
    description: 'Si se omite se generan 4 periodos de igual duración.',
  })
  periods?: PeriodDto[];

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, default: true })
  includeNationalHolidays?: boolean;
}

export class UpdateSchoolYearDto extends PartialType(CreateSchoolYearDto) {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  isActive?: boolean;
}

export class CreateHolidayDto {
  @IsString()
  @MaxLength(120)
  @ApiProperty()
  name!: string;

  @IsDateString()
  @ApiProperty({ example: '2026-02-27' })
  date!: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, default: false })
  isNational?: boolean;
}
