import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateAxisDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  @ApiProperty({ description: 'Clave estable del eje, p. ej. SALUD_BIENESTAR' })
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @ApiProperty()
  name!: string;

  @IsInt()
  @Min(1)
  @ApiProperty({ description: 'Ciclo al que pertenece el eje (1 o 2)' })
  cycle!: number;

  @IsString()
  @ApiProperty()
  description!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ required: false, type: [String] })
  gradeDetails?: string[];

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  order?: number;
}

export class UpdateAxisDto extends PartialType(CreateAxisDto) {}

export class CreateCapacityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @ApiProperty({ description: 'Clave estable, p. ej. SEC-1-COMUNICATIVA' })
  code!: string;

  @IsInt()
  @ApiProperty()
  gradeId!: number;

  @IsInt()
  @ApiProperty()
  specificCompetenceId!: number;

  @IsString()
  @ApiProperty()
  description!: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  order?: number;
}

export class UpdateCapacityDto extends PartialType(CreateCapacityDto) {}

export class CreatePerformanceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({ description: 'Clave estable, p. ej. SEC-1-COMUNICATIVA-01' })
  code!: string;

  @IsInt()
  @ApiProperty()
  gradeId!: number;

  @IsInt()
  @ApiProperty()
  capacityId!: number;

  @IsString()
  @ApiProperty()
  description!: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  order?: number;
}

export class UpdatePerformanceDto extends PartialType(CreatePerformanceDto) {}

/** Carga masiva del catálogo curricular. Todas las listas son opcionales. */
export class ImportCurriculumDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAxisDto)
  @ApiProperty({ required: false, type: [CreateAxisDto] })
  axes?: CreateAxisDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCapacityDto)
  @ApiProperty({ required: false, type: [CreateCapacityDto] })
  capacities?: CreateCapacityDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePerformanceDto)
  @ApiProperty({ required: false, type: [CreatePerformanceDto] })
  performances?: CreatePerformanceDto[];
}
