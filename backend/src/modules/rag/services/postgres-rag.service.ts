import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { RagService } from './interfaces/rag.service';
import { RagSearchQueryDto } from '../dtos/rag-search-query.dto';
import {
  RagChunkDto,
  RagSearchResultDto,
} from '../dtos/rag-search-result.dto';
import { RagTextSearchQueryDto } from '../dtos/rag-text-search-query.dto';
import {
  RagTextChunkDto,
  RagTextSearchResultDto,
} from '../dtos/rag-text-search-result.dto';
import { RagDocumentDto } from '../dtos/rag-document.dto';
import { RagChunkContextQueryDto } from '../dtos/rag-chunk-context-query.dto';
import {
  RagChunkContextResultDto,
  RagContextChunkDto,
} from '../dtos/rag-chunk-context-result.dto';
import { RagIndexStatusDto } from '../dtos/rag-index-status.dto';

interface RagDocumentRow {
  id: number;
  title: string | null;
  original_filename: string;
  source_path: string;
  department: string | null;
  project: string | null;
  sensitivity: string | null;
  status: string;
  chunk_count: number;
  created_at: Date;
}

interface RagVectorRow {
  id: number;
  chunk_index: number;
  content: string;
  section_title: string | null;
  page_start: number | null;
  page_end: number | null;
  metadata: Record<string, unknown> | null;
  distance: number;
  document_id: number;
  document_title: string | null;
  original_filename: string | null;
  source_path: string | null;
  department: string | null;
  project: string | null;
  sensitivity: string | null;
}

interface RagTextRow {
  id: number;
  chunk_index: number;
  content: string;
  section_title: string | null;
  page_start: number | null;
  page_end: number | null;
  metadata: Record<string, unknown> | null;
  rank: number;
  trigram_similarity: number | null;
  document_id: number;
  document_title: string | null;
  original_filename: string | null;
  source_path: string | null;
  department: string | null;
  project: string | null;
  sensitivity: string | null;
}

interface RagContextRow {
  id: number;
  chunk_index: number;
  content: string;
  section_title: string | null;
  page_start: number | null;
  page_end: number | null;
}

@Injectable()
export class PostgresRagService implements RagService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private buildFilters(
    query: { department?: string; project?: string; sensitivity?: string },
    extra: Prisma.Sql[] = [],
  ): Prisma.Sql {
    const conditions: Prisma.Sql[] = [
      ...extra,
      Prisma.sql`d.status = 'active'`,
    ];

    if (query.department) {
      conditions.push(Prisma.sql`d.department = ${query.department}`);
    }
    if (query.project) {
      conditions.push(Prisma.sql`d.project = ${query.project}`);
    }
    if (query.sensitivity) {
      conditions.push(Prisma.sql`d.sensitivity = ${query.sensitivity}`);
    }

    return Prisma.join(conditions, ' AND ');
  }

  private isMissingRelationError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;
    const record = error as Record<string, unknown>;
    if (record['code'] === 'P2010') return true;
    const message =
      typeof record['message'] === 'string' ? record['message'] : '';
    return (
      message.includes('42P01') ||
      message.includes('does not exist') ||
      message.includes('TableDoesNotExist')
    );
  }

  async searchVector(query: RagSearchQueryDto): Promise<RagSearchResultDto> {
    const startedAt = Date.now();
    const limit = query.limit ?? 5;
    const minScore = query.minScore ?? 0;
    const maxDistance = 1 - minScore;
    const vectorLiteral = `[${query.embedding.join(',')}]`;

    const whereClause = this.buildFilters(query, [
      Prisma.sql`dc.embedding IS NOT NULL`,
    ]);

    const rows = await this.prisma.$queryRaw<RagVectorRow[]>`
      SELECT
        dc.id,
        dc.chunk_index,
        dc.content,
        dc.section_title,
        dc.page_start,
        dc.page_end,
        dc.metadata,
        (dc.embedding <=> ${vectorLiteral}::vector) AS distance,
        d.id AS document_id,
        d.title AS document_title,
        d.original_filename,
        d.source_path,
        d.department,
        d.project,
        d.sensitivity
      FROM document_chunks dc
      INNER JOIN documents d ON d.id = dc.document_id
      WHERE ${whereClause}
        AND (dc.embedding <=> ${vectorLiteral}::vector) <= ${maxDistance}
      ORDER BY dc.embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `;

    const chunks: RagChunkDto[] = rows.map((row) => ({
      id: Number(row.id),
      chunkIndex: row.chunk_index,
      content: row.content,
      sectionTitle: row.section_title,
      pageStart: row.page_start,
      pageEnd: row.page_end,
      metadata: row.metadata,
      distance: row.distance,
      score: 1 - row.distance,
      documentId: Number(row.document_id),
      documentTitle: row.document_title,
      originalFilename: row.original_filename,
      sourcePath: row.source_path,
      department: row.department,
      project: row.project,
      sensitivity: row.sensitivity,
    }));

    return {
      chunks,
      totalMatches: chunks.length,
      executionTimeMs: Date.now() - startedAt,
    };
  }

  async searchText(query: RagTextSearchQueryDto): Promise<RagTextSearchResultDto> {
    const startedAt = Date.now();
    const limit = query.limit ?? 5;
    const tsquery = Prisma.sql`websearch_to_tsquery('simple', ${query.q})`;

    const whereClause = this.buildFilters(query, [
      Prisma.sql`dc.search_vector @@ ${tsquery}`,
    ]);

    const rows = await this.prisma.$queryRaw<RagTextRow[]>`
      SELECT
        dc.id,
        dc.chunk_index,
        dc.content,
        dc.section_title,
        dc.page_start,
        dc.page_end,
        dc.metadata,
        ts_rank_cd(dc.search_vector, ${tsquery}) AS rank,
        similarity(d.title, ${query.q}) AS trigram_similarity,
        d.id AS document_id,
        d.title AS document_title,
        d.original_filename,
        d.source_path,
        d.department,
        d.project,
        d.sensitivity
      FROM document_chunks dc
      INNER JOIN documents d ON d.id = dc.document_id
      WHERE ${whereClause}
      ORDER BY rank DESC, trigram_similarity DESC
      LIMIT ${limit}
    `;

    const chunks: RagTextChunkDto[] = rows.map((row) => ({
      id: Number(row.id),
      chunkIndex: row.chunk_index,
      content: row.content,
      sectionTitle: row.section_title,
      pageStart: row.page_start,
      pageEnd: row.page_end,
      metadata: row.metadata,
      rank: row.rank,
      trigramSimilarity: row.trigram_similarity,
      documentId: Number(row.document_id),
      documentTitle: row.document_title,
      originalFilename: row.original_filename,
      sourcePath: row.source_path,
      department: row.department,
      project: row.project,
      sensitivity: row.sensitivity,
    }));

    return {
      chunks,
      totalMatches: chunks.length,
      executionTimeMs: Date.now() - startedAt,
    };
  }

  async getIndexStatus(): Promise<RagIndexStatusDto> {
    let rows: {
      total_documents: number;
      total_chunks: number;
      latest_updated_at: Date | null;
    }[];
    try {
      rows = await this.prisma.$queryRaw<
        {
          total_documents: number;
          total_chunks: number;
          latest_updated_at: Date | null;
        }[]
      >`
        SELECT
          COUNT(DISTINCT d.id)::int AS total_documents,
          COUNT(dc.id)::int AS total_chunks,
          MAX(d.updated_at) AS latest_updated_at
        FROM documents d
        LEFT JOIN document_chunks dc ON dc.document_id = d.id
        WHERE d.status = 'active'
      `;
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        return { totalDocuments: 0, totalChunks: 0, version: '0:0:' };
      }
      throw error;
    }

    const row = rows[0];
    if (!row) {
      return { totalDocuments: 0, totalChunks: 0, version: '0:0:' };
    }

    const totalDocuments = Number(row.total_documents);
    const totalChunks = Number(row.total_chunks);
    const latest = row.latest_updated_at
      ? new Date(row.latest_updated_at).toISOString()
      : '';

    return {
      totalDocuments,
      totalChunks,
      version: `${totalDocuments}:${totalChunks}:${latest}`,
    };
  }

  async listDocuments(limit = 50, offset = 0): Promise<RagDocumentDto[]> {
    const rows = await this.prisma.$queryRaw<RagDocumentRow[]>`
      SELECT
        d.id,
        d.title,
        d.original_filename,
        d.source_path,
        d.department,
        d.project,
        d.sensitivity,
        d.status,
        d.created_at,
        COUNT(dc.id)::int AS chunk_count
      FROM documents d
      LEFT JOIN document_chunks dc ON dc.document_id = d.id
      GROUP BY d.id
      ORDER BY d.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      originalFilename: row.original_filename,
      sourcePath: row.source_path,
      department: row.department,
      project: row.project,
      sensitivity: row.sensitivity,
      status: row.status,
      chunkCount: Number(row.chunk_count),
      createdAt: row.created_at,
    }));
  }

  async getChunkContext(
    chunkId: number,
    query: RagChunkContextQueryDto,
  ): Promise<RagChunkContextResultDto> {
    const before = query.before ?? 3;
    const after = query.after ?? 3;

    const [chunkRows] = await this.prisma.$queryRaw<RagTextRow[]>`
      SELECT
        dc.id,
        dc.chunk_index,
        dc.content,
        dc.section_title,
        dc.page_start,
        dc.page_end,
        dc.metadata,
        0::float4 AS rank,
        NULL::float4 AS trigram_similarity,
        d.id AS document_id,
        d.title AS document_title,
        d.original_filename,
        d.source_path,
        d.department,
        d.project,
        d.sensitivity
      FROM document_chunks dc
      INNER JOIN documents d ON d.id = dc.document_id
      WHERE dc.id = ${chunkId}
        AND d.status = 'active'
      LIMIT 1
    `;

    if (!chunkRows) {
      throw new NotFoundException(`Chunk ${chunkId} not found`);
    }

    const contextRows = await this.prisma.$queryRaw<RagContextRow[]>`
      SELECT
        dc.id,
        dc.chunk_index,
        dc.content,
        dc.section_title,
        dc.page_start,
        dc.page_end
      FROM document_chunks dc
      WHERE dc.document_id = ${chunkRows.document_id}
        AND dc.chunk_index >= ${chunkRows.chunk_index - before}
        AND dc.chunk_index <= ${chunkRows.chunk_index + after}
        AND dc.id <> ${chunkId}
      ORDER BY dc.chunk_index ASC
    `;

    const context: RagContextChunkDto[] = contextRows.map((row) => ({
      id: Number(row.id),
      chunkIndex: row.chunk_index,
      content: row.content,
      sectionTitle: row.section_title,
      pageStart: row.page_start,
      pageEnd: row.page_end,
    }));

    const chunk: RagTextChunkDto = {
      id: Number(chunkRows.id),
      chunkIndex: chunkRows.chunk_index,
      content: chunkRows.content,
      sectionTitle: chunkRows.section_title,
      pageStart: chunkRows.page_start,
      pageEnd: chunkRows.page_end,
      metadata: chunkRows.metadata,
      rank: chunkRows.rank,
      trigramSimilarity: chunkRows.trigram_similarity,
      documentId: Number(chunkRows.document_id),
      documentTitle: chunkRows.document_title,
      originalFilename: chunkRows.original_filename,
      sourcePath: chunkRows.source_path,
      department: chunkRows.department,
      project: chunkRows.project,
      sensitivity: chunkRows.sensitivity,
    };

    return { chunk, context };
  }
}