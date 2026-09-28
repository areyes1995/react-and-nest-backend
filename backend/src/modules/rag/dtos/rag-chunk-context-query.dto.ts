import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RagChunkContextQueryDto {
  @IsInt()
  @Min(0)
  @Max(20)
  @Type(() => Number)
  @IsOptional()
  @ApiProperty({
    description: 'Número de chunks previos (por índice) a incluir como contexto.',
    default: 3,
    required: false,
  })
  before?: number = 3;

  @IsInt()
  @Min(0)
  @Max(20)
  @Type(() => Number)
  @IsOptional()
  @ApiProperty({
    description: 'Número de chunks posteriores (por índice) a incluir como contexto.',
    default: 3,
    required: false,
  })
  after?: number = 3;
}