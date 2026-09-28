import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@services/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
}))

import { get, post } from '@services/api'
import {
  ragTextSearch,
  ragVectorSearch,
  ragListDocuments,
  ragIndexStatus,
  clearRagDocsCache,
  ragListDocumentsCached,
  ragChunkContext,
} from '@services/rag'

const getMock = vi.mocked(get)
const postMock = vi.mocked(post)

describe('rag service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearRagDocsCache()
  })

  it('text search: defaults limit=8 y lanza si !ok', async () => {
    getMock.mockResolvedValue({ ok: true, status: 200, data: { chunks: [] } } as any)
    await ragTextSearch('hola')
    expect(get).toHaveBeenCalledWith(
      '/rag/text-search',
      expect.objectContaining({ q: 'hola', limit: 8 }),
    )
    getMock.mockResolvedValue({ ok: false, status: 500, error: 'bad' } as any)
    await expect(ragTextSearch('x')).rejects.toThrow('bad')
  })

  it('vector search usa POST /rag/search', async () => {
    postMock.mockResolvedValue({ ok: true, status: 200, data: { chunks: [] } } as any)
    await ragVectorSearch([0.1, 0.2])
    expect(post).toHaveBeenCalledWith(
      '/rag/search',
      expect.objectContaining({ embedding: [0.1, 0.2], limit: 8 }),
    )
  })

  it('cached: hit cuando la versión no cambia', async () => {
    getMock.mockImplementation((path: string) => {
      if (path === '/rag/documents/status')
        return Promise.resolve({ ok: true, status: 200, data: { version: 'v1' } } as any)
      return Promise.resolve({ ok: true, status: 200, data: [{ id: 1 }] } as any)
    })
    const first = await ragListDocumentsCached()
    expect(first.fromCache).toBe(false)
    const second = await ragListDocumentsCached()
    expect(second.fromCache).toBe(true)
    expect(second.docs).toEqual([{ id: 1 }])
    // status llamado 2 veces, documents solo 1
    expect(getMock.mock.calls.filter(c => c[0] === '/rag/documents')).toHaveLength(1)
  })

  it('cached: miss si cambia la versión o force=true', async () => {
    let version = 'v1'
    getMock.mockImplementation((path: string) => {
      if (path === '/rag/documents/status')
        return Promise.resolve({ ok: true, status: 200, data: { version } } as any)
      return Promise.resolve({ ok: true, status: 200, data: [{ id: 1 }] } as any)
    })
    await ragListDocumentsCached()
    version = 'v2'
    const miss = await ragListDocumentsCached()
    expect(miss.fromCache).toBe(false)
    const forced = await ragListDocumentsCached(100, true)
    expect(forced.fromCache).toBe(false)
  })

  it('clearRagDocsCache invalida', async () => {
    getMock.mockImplementation((path: string) => {
      if (path === '/rag/documents/status')
        return Promise.resolve({ ok: true, status: 200, data: { version: 'v1' } } as any)
      return Promise.resolve({ ok: true, status: 200, data: [] } as any)
    })
    await ragListDocumentsCached()
    clearRagDocsCache()
    const out = await ragListDocumentsCached()
    expect(out.fromCache).toBe(false)
  })

  it('chunk context defaults before/after=3', async () => {
    getMock.mockResolvedValue({ ok: true, status: 200, data: {} } as any)
    await ragChunkContext(10)
    expect(get).toHaveBeenCalledWith(
      '/rag/chunks/10/context',
      expect.objectContaining({ before: 3, after: 3 }),
    )
  })

  it('ragListDocuments defaults limit=100 offset=0', async () => {
    getMock.mockResolvedValue({ ok: true, status: 200, data: [] } as any)
    await ragListDocuments()
    expect(get).toHaveBeenCalledWith('/rag/documents', { limit: 100, offset: 0 })
    await ragIndexStatus()
    expect(get).toHaveBeenCalledWith('/rag/documents/status')
  })
})
