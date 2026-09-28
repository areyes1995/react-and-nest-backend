import { ApiProperty } from '@nestjs/swagger';
import { RagTextChunkDto } from './rag-text-search-result.dto';

export class RagContextChunkDto {
  @ApiProperty({ description: 'ID del chunk.' })
  id: number;

  @ApiProperty({ description: 'Índice del chunk dentro del documento.' })
  chunkIndex: number;

  @ApiProperty({ description: 'Contenido textual completo del chunk.' })
  content: string;

  @ApiProperty({ required: false, description: 'Título de la sección del chunk.' })
  sectionTitle: string | null;

  @ApiProperty({ required: false, description: 'Página inicial del chunk.' })
  pageStart: number | null;

  @ApiProperty({ required: false, description: 'Página final del chunk.' })
  pageEnd: number | null;
}

export class RagChunkContextResultDto {
  @ApiProperty({
    type: RagTextChunkDto,
    description: 'Chunk que coincidió con la búsqueda.',
  })
  chunk: RagTextChunkDto;

  @ApiProperty({
    type: [RagContextChunkDto],
    description:
      'Chunks vecinos del mismo documento (anteriores y posteriores por chunk_index), ordenados por índice.',
  })
  context: RagContextChunkDto[];
}