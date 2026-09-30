// ──────────────────────────────────────────────
// Exportación de documentos:
//   • Word (.doc HTML compatible con Microsoft Word)
//   • PDF (impresión del navegador → "Guardar como PDF")
//   • Excel (.xlsx con exceljs, carga diferida)
//   • PowerPoint (.pptx con pptxgenjs, carga diferida)
//   • iCalendar (.ics para Google Calendar / Outlook)
// ──────────────────────────────────────────────

import { downloadBlob } from './format'

export const DOC_STYLES = `
  body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; color: #1f1a3d; font-size: 11pt; margin: 24px; }
  h1 { font-size: 18pt; margin: 0 0 4px; color: #6d28d9; }
  h2 { font-size: 13pt; margin: 18px 0 6px; color: #be185d; }
  h3 { font-size: 11.5pt; margin: 12px 0 4px; }
  p { margin: 4px 0; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0; }
  th, td { border: 1px solid #c9b7ef; padding: 5px 6px; vertical-align: top; font-size: 9.5pt; text-align: left; }
  th { background: #f3e8ff; }
  .muted { color: #6b6588; font-size: 9pt; }
  .head { background: #fde68a; text-align: center; font-weight: bold; }
  .band { background: #fef3c7; }
  .center { text-align: center; }
  .sig { margin-top: 40px; display: flex; gap: 60px; }
  .sig div { border-top: 1px solid #1f1a3d; padding-top: 4px; min-width: 200px; text-align: center; font-size: 9pt; }
  ul { margin: 2px 0 2px 16px; padding: 0; }
  @page { size: landscape; margin: 14mm; }
`

export function escapeHtml(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrap(title: string, body: string, landscape = true) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${DOC_STYLES}${
    landscape ? '' : '@page { size: portrait; }'
  }</style></head><body>${body}</body></html>`
}

/** Descarga un documento compatible con Microsoft Word. */
export function exportWord(title: string, body: string, fileName: string) {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escapeHtml(
    title,
  )}</title><style>${DOC_STYLES}</style></head><body>${body}</body></html>`
  downloadBlob(new Blob(['\ufeff', html], { type: 'application/msword' }), fileName.endsWith('.doc') ? fileName : `${fileName}.doc`)
}

/** Abre el diálogo de impresión (permite "Guardar como PDF"). */
export function printDocument(title: string, body: string, landscape = true) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument!
  doc.open()
  doc.write(wrap(title, body, landscape))
  doc.close()
  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => iframe.remove(), 2000)
  }, 250)
}

// ── Excel ──────────────────────────────────────

export interface SheetSpec {
  name: string
  title?: string
  header: string[]
  rows: Array<Array<string | number | null | undefined>>
  widths?: number[]
}

export async function exportExcel(sheets: SheetSpec[], fileName: string) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Educraft XYZ'
  for (const spec of sheets) {
    const ws = wb.addWorksheet(spec.name.slice(0, 31))
    let rowIndex = 1
    if (spec.title) {
      ws.mergeCells(1, 1, 1, Math.max(1, spec.header.length))
      const cell = ws.getCell(1, 1)
      cell.value = spec.title
      cell.font = { bold: true, size: 13, color: { argb: 'FF6D28D9' } }
      rowIndex = 3
    }
    const header = ws.getRow(rowIndex)
    spec.header.forEach((h, i) => {
      const cell = header.getCell(i + 1)
      cell.value = h
      cell.font = { bold: true, color: { argb: 'FF3B0764' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFC4B5FD' } } }
      cell.alignment = { vertical: 'middle', wrapText: true }
    })
    spec.rows.forEach((r, i) => {
      const row = ws.getRow(rowIndex + 1 + i)
      r.forEach((v, j) => {
        row.getCell(j + 1).value = v ?? null
      })
    })
    spec.header.forEach((h, i) => {
      ws.getColumn(i + 1).width = spec.widths?.[i] ?? Math.min(40, Math.max(8, h.length + 2))
    })
    ws.views = [{ state: 'frozen', ySplit: rowIndex }]
  }
  const buffer = await wb.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`,
  )
}

/** Lee la primera hoja de un .xlsx o un .csv como matriz de celdas. */
export async function readSpreadsheet(file: File): Promise<string[][]> {
  if (/\.csv$/i.test(file.name) || file.type === 'text/csv') {
    const text = await file.text()
    const sep = text.split('\n')[0].includes(';') ? ';' : ','
    return text
      .split(/\r?\n/)
      .filter((l) => l.trim())
      .map((line) => parseCsvLine(line, sep))
  }
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(await file.arrayBuffer())
  const ws = wb.worksheets[0]
  const rows: string[][] = []
  ws?.eachRow({ includeEmpty: false }, (row) => {
    const values = (row.values as unknown[]).slice(1).map((v) => {
      if (v == null) return ''
      if (typeof v === 'object' && v !== null) {
        const o = v as { result?: unknown; text?: unknown; richText?: Array<{ text: string }> }
        if (o.result !== undefined) return String(o.result)
        if (o.text !== undefined) return String(o.text)
        if (o.richText) return o.richText.map((t) => t.text).join('')
      }
      return String(v)
    })
    rows.push(values)
  })
  return rows
}

function parseCsvLine(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === sep) {
      out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  out.push(cur.trim())
  return out
}

// ── PowerPoint ─────────────────────────────────

export interface PptSlide {
  title: string
  subtitle?: string
  layout: string
  bullets?: string[]
  text?: string
  formulas?: string[]
  notes?: string
}

const LAYOUT_COLORS: Record<string, [string, string]> = {
  title: ['FDE8F3', 'EC4899'],
  reflection: ['F0EAFE', '8B5CF6'],
  feedback: ['E6EFFF', '3B82F6'],
  purpose: ['FFF5D6', 'F59E0B'],
  agenda: ['E1F8E9', '22C55E'],
  section: ['FDE8F3', 'A855F7'],
  content: ['FFFFFF', '8B5CF6'],
  activities: ['FFEEDD', 'F97316'],
  assignment: ['F0EAFE', 'EC4899'],
  task: ['E0F4FD', '0EA5E9'],
  closing: ['FDE8F3', '8B5CF6'],
}

/** Presentación compatible con PowerPoint (plantilla pastel 16:9). */
export async function exportPptx(title: string, slides: PptSlide[], fileName: string) {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.title = title
  pptx.company = 'Educraft XYZ'
  for (const s of slides) {
    const [bg, accent] = LAYOUT_COLORS[s.layout] ?? LAYOUT_COLORS.content
    const slide = pptx.addSlide()
    slide.background = { color: bg }
    slide.addShape('ellipse', { x: 11.2, y: -1.2, w: 3.2, h: 3.2, fill: { color: accent, transparency: 80 } })
    slide.addShape('ellipse', { x: -1, y: 6, w: 2.6, h: 2.6, fill: { color: accent, transparency: 85 } })
    const isCover = s.layout === 'title' || s.layout === 'section' || s.layout === 'assignment'
    slide.addText(s.title, {
      x: 0.7,
      y: isCover ? 2.4 : 0.5,
      w: 12,
      h: isCover ? 1.4 : 0.9,
      fontSize: isCover ? 40 : 28,
      bold: true,
      color: '2E1065',
      fontFace: 'Calibri',
      align: isCover ? 'center' : 'left',
    })
    if (s.subtitle) {
      slide.addText(s.subtitle, { x: 0.7, y: isCover ? 3.8 : 1.3, w: 12, h: 0.6, fontSize: 18, color: accent, align: isCover ? 'center' : 'left' })
    }
    let y = s.subtitle ? 2.1 : 1.6
    if (s.text) {
      slide.addText(s.text, { x: 0.9, y, w: 11.5, h: 1.6, fontSize: 22, color: '3B3561', italic: s.layout === 'reflection' || s.layout === 'closing' })
      y += 1.8
    }
    if (s.formulas?.length) {
      slide.addText(s.formulas.join('\n'), { x: 0.9, y, w: 11.5, h: 0.5 * s.formulas.length + 0.3, fontSize: 22, color: '6D28D9', fontFace: 'Cambria Math' })
      y += 0.5 * s.formulas.length + 0.5
    }
    if (s.bullets?.length) {
      slide.addText(
        s.bullets.map((b) => ({ text: b, options: { bullet: { code: '25CF' }, paraSpaceAfter: 6 } })),
        { x: 0.9, y, w: 11.5, h: Math.min(5.4, 7.2 - y), fontSize: 18, color: '3B3561', valign: 'top' },
      )
    }
    if (s.notes) slide.addNotes(s.notes)
    slide.addText('Educraft XYZ', { x: 11.2, y: 7, w: 2, h: 0.3, fontSize: 9, color: '9D98B4', align: 'right' })
  }
  await pptx.writeFile({ fileName: fileName.endsWith('.pptx') ? fileName : `${fileName}.pptx` })
}

// ── iCalendar ──────────────────────────────────

export interface IcsEvent {
  uid: string
  title: string
  description?: string
  date: string // YYYY-MM-DD
  startTime?: string | null
  endTime?: string | null
}

export function exportIcs(events: IcsEvent[], fileName: string) {
  const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Educraft XYZ//Calendario académico//ES', 'CALSCALE:GREGORIAN']
  for (const e of events) {
    const day = e.date.replace(/-/g, '')
    lines.push('BEGIN:VEVENT', `UID:${e.uid}@educraft`, `DTSTAMP:${stamp}`)
    if (e.startTime) {
      lines.push(`DTSTART;TZID=America/Santo_Domingo:${day}T${e.startTime.replace(':', '')}00`)
      lines.push(`DTEND;TZID=America/Santo_Domingo:${day}T${(e.endTime ?? e.startTime).replace(':', '')}00`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${day}`)
    }
    lines.push(`SUMMARY:${esc(e.title)}`)
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  downloadBlob(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }), fileName.endsWith('.ics') ? fileName : `${fileName}.ics`)
}
