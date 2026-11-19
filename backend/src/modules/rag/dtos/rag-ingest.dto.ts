import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RagIngestDto {
  @IsOptional()
  @IsString()
  @MaxLength(200000)
  @ApiProperty({
    required: false,
    description: 'Texto pegado por el docente (alternativo al archivo).',
  })
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiProperty({
    required: false,
    description: 'Título legible del documento.',
  })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ required: false, description: 'Nombre original del archivo.' })
  originalFilename?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiProperty({ required: false })
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiProperty({ required: false })
  project?: string;

  @IsOptional()
  @IsIn(['internal', 'confidential', 'restricted', 'public'])
  @ApiProperty({
    required: false,
    enum: ['internal', 'confidential', 'restricted', 'public'],
  })
  sensitivity?: string;
}
