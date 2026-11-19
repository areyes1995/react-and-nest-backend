import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ResourceCategory } from '@prisma/client';

/** Las etiquetas llegan como arreglo (JSON) o "a, b, c" (multipart). */
export const toTags = ({ value }: { value: unknown }) =>
  (Array.isArray(value) ? value : String(value ?? '').split(','))
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean);

export class CreateResourceDto {
  @IsString()
  @MaxLength(200)
  @ApiProperty()
  title!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  description?: string;

  @IsEnum(ResourceCategory)
  @ApiProperty({ enum: ResourceCategory })
  category!: ResourceCategory;

  @IsOptional()
  @Transform(toTags)
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ required: false, type: [String] })
  tags?: string[];

  @IsOptional()
  @IsUrl({ require_tld: false })
  @ApiProperty({
    required: false,
    description: 'Enlace externo (si no se sube archivo)',
  })
  url?: string;
}

export class UpdateResourceDto extends PartialType(CreateResourceDto) {}

/** Alta/baja masiva de etiquetas sobre un recurso existente. */
export class BulkTagsDto {
  @IsOptional()
  @Transform(toTags)
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @ApiProperty({ required: false, type: [String] })
  add?: string[];

  @IsOptional()
  @Transform(toTags)
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @ApiProperty({ required: false, type: [String] })
  remove?: string[];
}

export class ShareResourceDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(180)
  @ApiProperty({
    required: false,
    default: 30,
    description: 'Días de vigencia del enlace',
  })
  days?: number;
}
