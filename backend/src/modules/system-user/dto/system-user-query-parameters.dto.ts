import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from 'src/shared/dtos/pagination-query.dto';

export class UserQueryParameters extends PaginationQueryDto {
  @IsOptional()
  @IsObject()
  @Transform(({ value }) => value ?? {})
  @ApiProperty({
    required: false,
    description:
      'Object containing key-value pairs for filtering. Allowed keys: id, firstName, lastName, email, role, isActive. example: filter[firstName]=John&filter[isActive]=true',
  })
  filter?: Record<string, unknown>;
}
