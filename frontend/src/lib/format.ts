// Formato de fechas, números y etiquetas (es-DO).

const LOCALE = 'es-DO'

/** "2025-05-15" → Date local (sin desplazamiento por zona horaria). */
export function parseDay(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Date local → "YYYY-MM-DD". */
export function toDay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const today = () => toDay(new Date())

export function addDays(day: string, n: number): string {
  const d = parseDay(day)
  d.setDate(d.getDate() + n)
  return toDay(d)
}

export function formatDate(value: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '—'
  const d = value.length <= 10 || value.endsWith('T00:00:00.000Z') ? parseDay(value) : new Date(value)
  return d.toLocaleDateString(LOCALE, opts)
}

export function formatDateLong(value: string) {
  return formatDate(value, { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(LOCALE, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function relativeTime(value: string) {
  const diff = (Date.now() - new Date(value).getTime()) / 1000
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 86400 * 7) return `hace ${Math.floor(diff / 86400)} d`
  return formatDate(value)
}

/** "08:00" → "08:00 am". */
export function formatTime(value?: string | null) {
  if (!value) return ''
  const [h, m] = value.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`
}

export function formatScore(value: number | null | undefined, digits = 0) {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toLocaleString(LOCALE, { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}

export function formatPercent(value: number | null | undefined) {
  return value == null ? '—' : `${formatScore(value, 1)}%`
}

export function formatBytes(bytes?: number | null) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`
}

/** "3ro de Secundaria" + "A" → "3° Secundaria A". */
export function sectionLabel(grade: string, name?: string) {
  const short = grade.replace(/^(\d)\s*(?:ro|do|to|er|mo|vo|no)?\s+de\s+/i, '$1° ')
  return name ? `${short} ${name}` : short
}

export const fullName = (s: { firstName: string; lastName: string }) => `${s.firstName} ${s.lastName}`
export const listName = (s: { firstName: string; lastName: string }) => `${s.lastName}, ${s.firstName}`

export const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export function greeting(date = new Date()) {
  const h = date.getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60)
}
