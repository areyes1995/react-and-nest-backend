import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ResourceCategory } from '@prisma/client';

/** Las etiquetas llegan como arreglo (JSON) o "a, b, c" (multipart). */
const toTags = ({ value }: { value: unknown }) =>
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
  @ApiProperty({ required: false, description: 'Enlace externo (si no se sube archivo)' })
  url?: string;
}

export class UpdateResourceDto extends PartialType(CreateResourceDto) {}
