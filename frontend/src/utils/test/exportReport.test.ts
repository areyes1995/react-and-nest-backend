import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportReport, type ReportConfig } from '@utils/exportReport'

const base: ReportConfig = {
  title: 'Reporte',
  headers: ['Nombre', 'Valor'],
  data: [
    { nombre: 'A "quoted"', valor: 1 },
    { nombre: 'B', valor: 2 },
  ],
  fileName: 'reporte.csv',
}

describe('exportReport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('csv: escapa comillas y dispara descarga', async () => {
    const blobs: Blob[] = []
    vi.spyOn(URL, 'createObjectURL').mockImplementation((b: any) => {
      blobs.push(b as Blob)
      return 'blob:csv'
    })
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.fn()
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag === 'a') return { href: '', download: '', click } as any
      return document.createElement(tag as any)
    }) as any)

    exportReport('csv', base)
    expect(blobs).toHaveLength(1)
    expect(blobs[0].type).toContain('text/csv')
    const text = await blobs[0].text()
    expect(text).toContain('Nombre,Valor')
    expect(text).toContain('"A ""quoted"""')
    expect(click).toHaveBeenCalledTimes(1)
    expect(revoke).toHaveBeenCalledWith('blob:csv')
  })

  it('excel: genera tabla HTML y dispara descarga', async () => {
    const blobs: Blob[] = []
    vi.spyOn(URL, 'createObjectURL').mockImplementation((b: any) => {
      blobs.push(b as Blob)
      return 'blob:xls'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag === 'a') return { href: '', download: 'r.xls', click: vi.fn() } as any
      return document.createElement(tag as any)
    }) as any)

    exportReport('excel', base)
    const html = await blobs[0].text()
    expect(html).toContain('<table>')
    expect(html).toContain('Nombre')
  })

  it('pdf: abre ventana, escribe y cierra', () => {
    const write = vi.fn()
    const close = vi.fn()
    vi.spyOn(window, 'open').mockReturnValue({ document: { write, close } } as any)
    exportReport('pdf', base)
    expect(window.open).toHaveBeenCalledWith('', '_blank')
    expect(write).toHaveBeenCalledTimes(1)
    expect(String(write.mock.calls[0][0])).toContain('Reporte')
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('pdf: no falla si el popup está bloqueado', () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    expect(() => exportReport('pdf', base)).not.toThrow()
  })
})
