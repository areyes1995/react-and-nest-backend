import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class RagTextSearchQueryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description:
      'Texto libre a buscar. Se interpreta con websearch_to_tsquery sobre el tsvector de los chunks (búsqueda full-text, sin modelo de embedding).',
    required: true,
  })
  q: string;

  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  @IsOptional()
  @ApiProperty({
    description: 'Número de resultados a devolver.',
    default: 5,
    required: false,
  })
  limit?: number = 5;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Filtro opcional por departamento del documento.',
    required: false,
  })
  department?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Filtro opcional por proyecto del documento.',
    required: false,
  })
  project?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Filtro opcional por nivel de sensibilidad (internal, confidential, etc.).',
    required: false,
  })
  sensitivity?: string;
}