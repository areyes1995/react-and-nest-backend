import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { SharedResourceType } from '@prisma/client';

/** Puntero al recurso propio que se comparte en el hilo. */
export class SharedResourcePointerDto {
  @IsEnum(SharedResourceType)
  @ApiProperty({ enum: SharedResourceType })
  type!: SharedResourceType;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @ApiProperty({
    description: 'Identificador del recurso en la biblioteca o planificación',
  })
  id!: number;
}

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @ApiPropertyOptional({ description: 'Título opcional de la conversación' })
  title?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  @ApiProperty({ type: [Number], description: 'Ids de los docentes invitados' })
  participantIds!: number[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  @ApiPropertyOptional({ description: 'Primer mensaje de la conversación' })
  message?: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  @ApiProperty()
  content!: string;
}

export class ShareResourceDto {
  @IsObject()
  @ValidateNested()
  @Type(() => SharedResourcePointerDto)
  @ApiProperty({ type: SharedResourcePointerDto })
  sharedResource!: SharedResourcePointerDto;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  @ApiPropertyOptional({ description: 'Nota para los participantes' })
  note?: string;
}
