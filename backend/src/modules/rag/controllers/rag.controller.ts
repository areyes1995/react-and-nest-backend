import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import type { DocumentTextExtractorService } from 'src/modules/document/services/interfaces/document-text-extractor.service';
import { RagService } from '../services/interfaces/rag.service';
import { RagIngestDto } from '../dtos/rag-ingest.dto';
import { RagSearchQueryDto } from '../dtos/rag-search-query.dto';
import { RagSearchResultDto } from '../dtos/rag-search-result.dto';
import { RagTextSearchQueryDto } from '../dtos/rag-text-search-query.dto';
import { RagTextSearchResultDto } from '../dtos/rag-text-search-result.dto';
import { RagDocumentDto } from '../dtos/rag-document.dto';
import { RagIndexStatusDto } from '../dtos/rag-index-status.dto';
import { RagChunkContextQueryDto } from '../dtos/rag-chunk-context-query.dto';
import { RagChunkContextResultDto } from '../dtos/rag-chunk-context-result.dto';

interface RagUploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const MAX_INGEST_BYTES = 25 * 1024 * 1024;
const UNPROCESSABLE_MEDIA = /^(image|audio|video)\//i;
const BINARY_EXTENSION =
  /\.(png|jpe?g|gif|webp|bmp|tiff?|mp3|wav|ogg|m4a|mp4|mov|avi|mkv|zip)$/i;

@ApiTags('rag')
@Controller('rag')
@UseGuards(JwtGuard)
export class RagController {
  constructor(
    @Inject('RagService')
    private readonly ragService: RagService,
    @Inject('DocumentTextExtractorService')
    private readonly extractor: DocumentTextExtractorService,
  ) {}

  @Post('ingest')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_INGEST_BYTES } }),
  )
  @ApiResponse({
    status: 201,
    description:
      'Indexa texto pegado o un archivo PDF/TXT/MD con búsqueda full-text (tsvector).',
  })
  async ingest(
    @Body() dto: RagIngestDto,
    @UploadedFile() file?: RagUploadedFile,
  ) {
    let text = dto.content ?? '';
    let originalFilename = dto.originalFilename ?? 'texto pegado';
    let mimeType = 'text/plain';
    let fileSizeBytes: number | undefined;

    if (file) {
      originalFilename = file.originalname;
      mimeType = file.mimetype;
      fileSizeBytes = file.size;
      if (
        UNPROCESSABLE_MEDIA.test(mimeType) ||
        BINARY_EXTENSION.test(originalFilename)
      ) {
        throw new BadRequestException(
          'No se puede analizar este tipo de archivo: OCR no disponible para imágenes, audio ni video. Pega el texto del documento.',
        );
      }
      if (
        mimeType.startsWith('text/') ||
        /\.(txt|md|markdown)$/i.test(originalFilename)
      ) {
        text = file.buffer.toString('utf8');
      } else {
        try {
          text = (await this.extractor.extractText(file.buffer, mimeType)).text;
        } catch {
          throw new BadRequestException(
            'No se pudo extraer texto del archivo. Usa PDF con texto, TXT/MD o pega el contenido; OCR no disponible.',
          );
        }
      }
    }

    if (!text.trim()) {
      throw new BadRequestException(
        'No hay texto para indexar. Pega el contenido del documento o sube un PDF/TXT/MD.',
      );
    }

    return this.ragService.ingest({
      text,
      title: dto.title,
      originalFilename,
      mimeType,
      fileSizeBytes,
      department: dto.department,
      project: dto.project,
      sensitivity: dto.sensitivity,
    });
  }

  @Post('search')
  @ApiResponse({
    status: 201,
    description:
      'Búsqueda semántica por vector (sin IA). Devuelve los top-K chunks más similares.',
    type: RagSearchResultDto,
  })
  search(@Body() query: RagSearchQueryDto): Promise<RagSearchResultDto> {
    return this.ragService.searchVector(query);
  }

  @Get('text-search')
  @ApiResponse({
    status: 200,
    description:
      'Búsqueda full-text (sin modelo de embedding). Devuelve los chunks que coinciden con la query.',
    type: RagTextSearchResultDto,
  })
  textSearch(
    @Query() query: RagTextSearchQueryDto,
  ): Promise<RagTextSearchResultDto> {
    return this.ragService.searchText(query);
  }

  @Get('documents/status')
  @ApiResponse({
    status: 200,
    description:
      'Estado resumido del índice (conteos + fingerprint) para invalidar caché sin recargar la lista completa.',
    type: RagIndexStatusDto,
  })
  getIndexStatus(): Promise<RagIndexStatusDto> {
    return this.ragService.getIndexStatus();
  }

  @Get('documents')
  @ApiResponse({
    status: 200,
    description:
      'Lista los documentos indexados en el RAG con su conteo de chunks.',
    type: [RagDocumentDto],
  })
  listDocuments(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<RagDocumentDto[]> {
    return this.ragService.listDocuments(
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0,
    );
  }

  @Get('chunks/:id/context')
  @ApiResponse({
    status: 200,
    description:
      'Devuelve un chunk con los chunks vecinos del mismo documento (contenido completo previo/posterior por índice).',
    type: RagChunkContextResultDto,
  })
  getChunkContext(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: RagChunkContextQueryDto,
  ): Promise<RagChunkContextResultDto> {
    return this.ragService.getChunkContext(id, query);
  }
}
