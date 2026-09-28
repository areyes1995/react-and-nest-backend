import { ApiProperty } from '@nestjs/swagger';

export class RagIndexStatusDto {
  @ApiProperty({ description: 'Total de documentos activos indexados.' })
  totalDocuments: number;

  @ApiProperty({ description: 'Total de chunks indexados.' })
  totalChunks: number;

  @ApiProperty({
    description:
      'Fingerprint del índice para invalidación de caché: `<docs>|<chunks>|<max updated_at>` ISO.',
  })
  version: string;
}
