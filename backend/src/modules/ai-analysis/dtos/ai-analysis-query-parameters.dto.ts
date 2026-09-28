import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsObject, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/shared/dtos/pagination-query.dto';

export class AiAnalysisQueryParametersDto extends PaginationQueryDto {
  @IsOptional()
  @IsObject()
  @Transform(({ value }) => value ?? {})
  @ApiProperty({
    required: false,
    description:
      'Optional filter object; supported keys include "id", "status", "analysisType".',
  })
  filter?: Record<string, unknown>;
}
