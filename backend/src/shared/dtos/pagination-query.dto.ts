import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ default: 1, required: true })
  page: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ default: 10, required: true })
  pageSize: number = 10;
}
