import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class RagSearchQueryDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4096)
  @IsNumber({}, { each: true })
  @ApiProperty({
    description:
      'Vector de consulta (embedding) generado con nvidia/nv-embedqa-e5-v5 (1024 dimensiones, input_type=query).',
    example: [0.1, 0.2, 0.3],
    required: true,
  })
  embedding: number[];

  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  @ApiProperty({
    description: 'Número de chunks a devolver (top-K).',
    default: 5,
    required: false,
  })
  limit?: number = 5;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  @ApiProperty({
    description: 'Score mínimo (similitud coseno, 1 - distancia) para incluir un chunk.',
    default: 0,
    required: false,
  })
  minScore?: number = 0;

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
