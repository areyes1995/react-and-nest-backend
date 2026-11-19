import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @ApiProperty()
  userId!: number;

  @IsEnum(NotificationType)
  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @ApiProperty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional()
  link?: string;
}
