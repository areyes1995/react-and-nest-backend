import { RagSearchQueryDto } from '../../dtos/rag-search-query.dto';
import { RagSearchResultDto } from '../../dtos/rag-search-result.dto';
import { RagTextSearchQueryDto } from '../../dtos/rag-text-search-query.dto';
import { RagTextSearchResultDto } from '../../dtos/rag-text-search-result.dto';
import { RagDocumentDto } from '../../dtos/rag-document.dto';
import { RagChunkContextQueryDto } from '../../dtos/rag-chunk-context-query.dto';
import { RagChunkContextResultDto } from '../../dtos/rag-chunk-context-result.dto';
import { RagIndexStatusDto } from '../../dtos/rag-index-status.dto';

export interface RagService {
  searchVector(query: RagSearchQueryDto): Promise<RagSearchResultDto>;
  searchText(query: RagTextSearchQueryDto): Promise<RagTextSearchResultDto>;
  getIndexStatus(): Promise<RagIndexStatusDto>;
  listDocuments(limit?: number, offset?: number): Promise<RagDocumentDto[]>;
  getChunkContext(
    chunkId: number,
    query: RagChunkContextQueryDto,
  ): Promise<RagChunkContextResultDto>;
}
