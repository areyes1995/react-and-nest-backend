// ──────────────────────────────────────────────
// translateContent: traduce solo los textos del
// contenido, conserva la forma y, si el servicio no
// responde, deja el español.
// ──────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { translateContent, translateTexts } from '@services/translate'

/** Servicio falso: antepone "EN:" y guarda qué textos le llegaron. */
function mockService() {
  const received: string[] = []
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { q: string[] }
    received.push(...body.q)
    return new Response(JSON.stringify({ translatedText: body.q.map(t => `EN:${t}`), complete: true }))
  })
  vi.stubGlobal('fetch', fetchMock)
  return { received, fetchMock }
}

// Cada test usa textos propios: la caché en memoria es de toda la sesión.
let n = 0
const uid = (text: string) => `${text} ${++n}`

describe('translateContent', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('traduce los textos y conserva ids, cartas, enums y números', async () => {
    const { received } = mockService()
    const question = uid('¿Quién gana?')
    const data = {
      id: 'q-1',
      level: 'beginner',
      playlistId: 'pl-basics',
      question,
      options: ['Tú', 'El rival'],
      answerIndex: 1,
      hole: 'As Kh',
      verdict: 'good',
      range: '77+, AJs+, KQo',
      position: 'UTG',
    }

    const out = await translateContent(data, 'en')

    expect(out).toEqual({
      ...data,
      question: `EN:${question}`,
      options: ['EN:Tú', 'EN:El rival'],
    })
    expect(received).not.toContain('As Kh')
    expect(received).not.toContain('pl-basics')
    expect(received).not.toContain('77+, AJs+, KQo')
  })

  it('en español no llama al servicio', async () => {
    const { fetchMock } = mockService()
    const data = { title: uid('Clase') }
    expect(await translateContent(data, 'es')).toBe(data)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('repite textos una sola vez y usa la caché después', async () => {
    const { fetchMock, received } = mockService()
    const text = uid('Ciega grande')
    await translateContent({ a: text, b: [text, text] }, 'en')
    expect(received.filter(t => t === text)).toHaveLength(1)

    fetchMock.mockClear()
    expect(await translateTexts([text], 'en')).toEqual([`EN:${text}`])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sin servicio devuelve el español', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const text = uid('Posición')
    expect(await translateContent({ title: text }, 'en')).toEqual({ title: text })
  })
})
