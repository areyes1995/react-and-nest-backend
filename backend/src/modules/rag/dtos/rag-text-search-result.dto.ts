import { ApiProperty } from '@nestjs/swagger';

export class RagTextChunkDto {
  @ApiProperty({ description: 'ID del chunk.' })
  id: number;

  @ApiProperty({ description: 'Índice del chunk dentro del documento.' })
  chunkIndex: number;

  @ApiProperty({ description: 'Contenido textual del fragmento.' })
  content: string;

  @ApiProperty({ required: false, description: 'Título de la sección del chunk.' })
  sectionTitle: string | null;

  @ApiProperty({ required: false, description: 'Página inicial del chunk.' })
  pageStart: number | null;

  @ApiProperty({ required: false, description: 'Página final del chunk.' })
  pageEnd: number | null;

  @ApiProperty({ required: false, description: 'Metadatos del chunk.' })
  metadata: Record<string, unknown> | null;

  @ApiProperty({ description: 'Relevancia full-text (ts_rank_cd, 0-1).' })
  rank: number;

  @ApiProperty({ required: false, description: 'Similitud trigram (0-1) si aplica (pg_trgm).' })
  trigramSimilarity: number | null;

  @ApiProperty({ description: 'ID del documento origen.' })
  documentId: number;

  @ApiProperty({ required: false, description: 'Título del documento origen.' })
  documentTitle: string | null;

  @ApiProperty({ required: false, description: 'Nombre original del archivo.' })
  originalFilename: string | null;

  @ApiProperty({ required: false, description: 'Ruta del documento en la fuente.' })
  sourcePath: string | null;

  @ApiProperty({ required: false, description: 'Departamento del documento.' })
  department: string | null;

  @ApiProperty({ required: false, description: 'Proyecto del documento.' })
  project: string | null;

  @ApiProperty({ required: false, description: 'Nivel de sensibilidad del documento.' })
  sensitivity: string | null;
}

export class RagTextSearchResultDto {
  @ApiProperty({ type: [RagTextChunkDto], description: 'Chunks coincidentes por texto (top-N).' })
  chunks: RagTextChunkDto[];

  @ApiProperty({ description: 'Número total de chunks que coincidieron.' })
  totalMatches: number;

  @ApiProperty({ description: 'Tiempo de ejecución de la consulta en milisegundos.' })
  executionTimeMs: number;
}