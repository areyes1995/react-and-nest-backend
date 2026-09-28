import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RagService } from '../services/interfaces/rag.service';
import { RagSearchQueryDto } from '../dtos/rag-search-query.dto';
import { RagSearchResultDto } from '../dtos/rag-search-result.dto';
import { RagTextSearchQueryDto } from '../dtos/rag-text-search-query.dto';
import { RagTextSearchResultDto } from '../dtos/rag-text-search-result.dto';
import { RagDocumentDto } from '../dtos/rag-document.dto';
import { RagIndexStatusDto } from '../dtos/rag-index-status.dto';
import { RagChunkContextQueryDto } from '../dtos/rag-chunk-context-query.dto';
import { RagChunkContextResultDto } from '../dtos/rag-chunk-context-result.dto';

@ApiTags('rag')
@Controller('rag')
@UseGuards(JwtGuard)
export class RagController {
  constructor(
    @Inject('RagService')
    private readonly ragService: RagService,
  ) {}

  @Post('search')
  @ApiResponse({
    status: 201,
    description: 'Búsqueda semántica por vector (sin IA). Devuelve los top-K chunks más similares.',
    type: RagSearchResultDto,
  })
  search(@Body() query: RagSearchQueryDto): Promise<RagSearchResultDto> {
    return this.ragService.searchVector(query);
  }

  @Get('text-search')
  @ApiResponse({
    status: 200,
    description: 'Búsqueda full-text (sin modelo de embedding). Devuelve los chunks que coinciden con la query.',
    type: RagTextSearchResultDto,
  })
  textSearch(@Query() query: RagTextSearchQueryDto): Promise<RagTextSearchResultDto> {
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
    description: 'Lista los documentos indexados en el RAG con su conteo de chunks.',
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