// ──────────────────────────────────────────────
// RAG Service — Búsqueda sobre la base vectorial
// Endpoints: /rag/search, /rag/text-search, /rag/documents
// ──────────────────────────────────────────────

import { get, post } from './api'

export interface RagDocument {
  id: number
  title: string | null
  originalFilename: string
  sourcePath: string
  department: string | null
  project: string | null
  sensitivity: string | null
  status: string
  chunkCount: number
  createdAt: string
}

export interface RagIndexStatus {
  totalDocuments: number
  totalChunks: number
  version: string
}

export interface RagChunk {
  id: number
  chunkIndex: number
  content: string
  sectionTitle: string | null
  pageStart: number | null
  pageEnd: number | null
  metadata: Record<string, unknown> | null
  distance: number
  score: number
  documentId: number
  documentTitle: string | null
  originalFilename: string | null
  sourcePath: string | null
  department: string | null
  project: string | null
  sensitivity: string | null
}

export interface RagVectorSearchResult {
  chunks: RagChunk[]
  totalMatches: number
  executionTimeMs: number
}

export interface RagTextChunk {
  id: number
  chunkIndex: number
  content: string
  sectionTitle: string | null
  pageStart: number | null
  pageEnd: number | null
  metadata: Record<string, unknown> | null
  rank: number
  trigramSimilarity: number | null
  documentId: number
  documentTitle: string | null
  originalFilename: string | null
  sourcePath: string | null
  department: string | null
  project: string | null
  sensitivity: string | null
}

export interface RagTextSearchResult {
  chunks: RagTextChunk[]
  totalMatches: number
  executionTimeMs: number
}

export interface RagContextChunk {
  id: number
  chunkIndex: number
  content: string
  sectionTitle: string | null
  pageStart: number | null
  pageEnd: number | null
}

export interface RagChunkContext {
  chunk: RagTextChunk
  context: RagContextChunk[]
}

export interface RagChunkContextFilters {
  before?: number
  after?: number
}

export interface RagSearchFilters {
  department?: string
  project?: string
  sensitivity?: string
  limit?: number
}

// ─── Text search (full-text, sin modelo de embedding) ───

export async function ragTextSearch(
  q: string,
  filters?: RagSearchFilters,
): Promise<RagTextSearchResult> {
  const res = await get<RagTextSearchResult>('/rag/text-search', {
    q,
    department: filters?.department,
    project: filters?.project,
    sensitivity: filters?.sensitivity,
    limit: filters?.limit ?? 8,
  })
  if (!res.ok) {
    throw new Error(res.error || 'Error en la búsqueda')
  }
  return res.data
}

// ─── Vector search (semántica directa por vector) ───

export async function ragVectorSearch(
  embedding: number[],
  filters?: RagSearchFilters,
): Promise<RagVectorSearchResult> {
  const res = await post<RagVectorSearchResult>('/rag/search', {
    embedding,
    department: filters?.department,
    project: filters?.project,
    sensitivity: filters?.sensitivity,
    limit: filters?.limit ?? 8,
  })
  if (!res.ok) {
    throw new Error(res.error || 'Error en la búsqueda semántica')
  }
  return res.data
}

// ─── Documentos indexados ───

export async function ragListDocuments(
  limit = 100,
  offset = 0,
): Promise<RagDocument[]> {
  const res = await get<RagDocument[]>('/rag/documents', { limit, offset })
  if (!res.ok) {
    throw new Error(res.error || 'Error al listar documentos')
  }
  return res.data
}

// ─── Estado del índice (ligero, para invalidar caché) ───

export async function ragIndexStatus(): Promise<RagIndexStatus> {
  const res = await get<RagIndexStatus>('/rag/documents/status')
  if (!res.ok) {
    throw new Error(res.error || 'Error al obtener el estado del índice')
  }
  return res.data
}

// ─── Caché de la lista de documentos ───
// Se reutiliza mientras el fingerprint del índice no cambie,
// evitando recargar la lista completa en cada visita.

interface RagDocsCache {
  version: string
  docs: RagDocument[]
}

let docsCache: RagDocsCache | null = null

export function clearRagDocsCache(): void {
  docsCache = null
}

export async function ragListDocumentsCached(
  limit = 100,
  force = false,
): Promise<{ docs: RagDocument[]; fromCache: boolean }> {
  const status = await ragIndexStatus()
  if (!force && docsCache && docsCache.version === status.version) {
    return { docs: docsCache.docs, fromCache: true }
  }
  const docs = await ragListDocuments(limit, 0)
  docsCache = { version: status.version, docs }
  return { docs, fromCache: false }
}

// ─── Contexto de un chunk (contenido previo/posterior del documento) ───

export async function ragChunkContext(
  chunkId: number,
  filters?: RagChunkContextFilters,
): Promise<RagChunkContext> {
  const res = await get<RagChunkContext>(`/rag/chunks/${chunkId}/context`, {
    before: filters?.before ?? 3,
    after: filters?.after ?? 3,
  })
  if (!res.ok) {
    throw new Error(res.error || 'Error al obtener el contexto del chunk')
  }
  return res.data
}

export { MOCK_ENABLED } from './api'