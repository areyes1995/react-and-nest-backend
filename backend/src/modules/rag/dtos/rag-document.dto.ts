import { ApiProperty } from '@nestjs/swagger';

export class RagDocumentDto {
  @ApiProperty({ description: 'ID del documento.' })
  id: number;

  @ApiProperty({ required: false, description: 'Título del documento.' })
  title: string | null;

  @ApiProperty({ description: 'Nombre original del archivo.' })
  originalFilename: string;

  @ApiProperty({ description: 'Ruta del documento en la fuente.' })
  sourcePath: string;

  @ApiProperty({ required: false, description: 'Departamento.' })
  department: string | null;

  @ApiProperty({ required: false, description: 'Proyecto.' })
  project: string | null;

  @ApiProperty({ required: false, description: 'Sensibilidad.' })
  sensitivity: string | null;

  @ApiProperty({ description: 'Estado (active/archived/...).' })
  status: string;

  @ApiProperty({ description: 'Número de chunks del documento.' })
  chunkCount: number;

  @ApiProperty({ description: 'Fecha de creación.' })
  createdAt: Date;
}