import { useMemo, useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { Field, Input, Select } from '@components/ui'
import { formatNumber } from '@lib/math/expr'
import { cn } from '@lib/cn'

type Category = 'longitud' | 'area' | 'volumen' | 'masa' | 'tiempo' | 'velocidad' | 'temperatura' | 'angulos'

// Factor a la unidad base de cada categoría.
const UNITS: Record<Exclude<Category, 'temperatura'>, Record<string, { label: string; factor: number }>> = {
  longitud: {
    mm: { label: 'Milímetro (mm)', factor: 0.001 },
    cm: { label: 'Centímetro (cm)', factor: 0.01 },
    m: { label: 'Metro (m)', factor: 1 },
    km: { label: 'Kilómetro (km)', factor: 1000 },
    in: { label: 'Pulgada (in)', factor: 0.0254 },
    ft: { label: 'Pie (ft)', factor: 0.3048 },
    yd: { label: 'Yarda (yd)', factor: 0.9144 },
    mi: { label: 'Milla (mi)', factor: 1609.344 },
  },
  area: {
    cm2: { label: 'cm²', factor: 1e-4 },
    m2: { label: 'm²', factor: 1 },
    km2: { label: 'km²', factor: 1e6 },
    ha: { label: 'Hectárea (ha)', factor: 1e4 },
    tarea: { label: 'Tarea (RD, 628.86 m²)', factor: 628.86 },
    ft2: { label: 'ft²', factor: 0.09290304 },
    acre: { label: 'Acre', factor: 4046.8564224 },
  },
  volumen: {
    ml: { label: 'Mililitro (mL)', factor: 1e-3 },
    l: { label: 'Litro (L)', factor: 1 },
    cm3: { label: 'cm³', factor: 1e-3 },
    m3: { label: 'm³', factor: 1000 },
    gal: { label: 'Galón EE. UU.', factor: 3.785411784 },
    oz: { label: 'Onza líquida', factor: 0.0295735 },
  },
  masa: {
    mg: { label: 'Miligramo (mg)', factor: 1e-6 },
    g: { label: 'Gramo (g)', factor: 1e-3 },
    kg: { label: 'Kilogramo (kg)', factor: 1 },
    t: { label: 'Tonelada (t)', factor: 1000 },
    lb: { label: 'Libra (lb)', factor: 0.45359237 },
    oz: { label: 'Onza (oz)', factor: 0.028349523125 },
    qq: { label: 'Quintal (100 lb)', factor: 45.359237 },
  },
  tiempo: {
    s: { label: 'Segundo', factor: 1 },
    min: { label: 'Minuto', factor: 60 },
    h: { label: 'Hora', factor: 3600 },
    d: { label: 'Día', factor: 86400 },
    sem: { label: 'Semana', factor: 604800 },
    a: { label: 'Año (365 d)', factor: 31536000 },
  },
  velocidad: {
    ms: { label: 'm/s', factor: 1 },
    kmh: { label: 'km/h', factor: 1 / 3.6 },
    mph: { label: 'mi/h', factor: 0.44704 },
    kn: { label: 'Nudo', factor: 0.514444 },
  },
  angulos: {
    deg: { label: 'Grado (°)', factor: Math.PI / 180 },
    rad: { label: 'Radián (rad)', factor: 1 },
    grad: { label: 'Gradián (gon)', factor: Math.PI / 200 },
    rev: { label: 'Vuelta', factor: 2 * Math.PI },
  },
}

const TEMPS = { C: 'Celsius (°C)', F: 'Fahrenheit (°F)', K: 'Kelvin (K)' }
const toC = (v: number, u: string) => (u === 'C' ? v : u === 'F' ? ((v - 32) * 5) / 9 : v - 273.15)
const fromC = (c: number, u: string) => (u === 'C' ? c : u === 'F' ? (c * 9) / 5 + 32 : c + 273.15)

const CATEGORIES: Array<{ key: Category; label: string; emoji: string }> = [
  { key: 'longitud', label: 'Longitud', emoji: '📏' },
  { key: 'area', label: 'Área', emoji: '⬛' },
  { key: 'volumen', label: 'Volumen', emoji: '🧊' },
  { key: 'masa', label: 'Masa', emoji: '⚖️' },
  { key: 'tiempo', label: 'Tiempo', emoji: '⏱️' },
  { key: 'velocidad', label: 'Velocidad', emoji: '🚗' },
  { key: 'temperatura', label: 'Temperatura', emoji: '🌡️' },
  { key: 'angulos', label: 'Ángulos', emoji: '📐' },
]

/** 3.3 Conversor de unidades para problemas contextualizados. */
export function UnitConverter() {
  const [cat, setCat] = useState<Category>('longitud')
  const units = cat === 'temperatura' ? Object.fromEntries(Object.entries(TEMPS).map(([k, label]) => [k, { label, factor: 1 }])) : UNITS[cat]
  const keys = Object.keys(units)
  const [from, setFrom] = useState(keys[2] ?? keys[0])
  const [to, setTo] = useState(keys[3] ?? keys[1])
  const [value, setValue] = useState('1')

  const pick = (c: Category) => {
    setCat(c)
    const k = c === 'temperatura' ? Object.keys(TEMPS) : Object.keys(UNITS[c])
    setFrom(k[0])
    setTo(k[1])
  }

  const result = useMemo(() => {
    const v = Number(value.replace(',', '.'))
    if (!Number.isFinite(v) || !units[from] || !units[to]) return null
    if (cat === 'temperatura') return fromC(toC(v, from), to)
    return (v * units[from].factor) / units[to].factor
  }, [value, from, to, cat, units])

  const table = useMemo(() => {
    const v = Number(value.replace(',', '.'))
    if (!Number.isFinite(v) || !units[from]) return []
    return keys.filter((k) => k !== from).map((k) => ({ k, label: units[k].label, value: cat === 'temperatura' ? fromC(toC(v, from), k) : (v * units[from].factor) / units[k].factor }))
  }, [value, from, keys, units, cat])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
        {CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => pick(c.key)} className={cn('flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-xs font-semibold transition', cat === c.key ? 'border-brand-purple bg-soft-purple text-brand-purple' : 'border-line text-ink-2 hover:border-violet-200')}>
            <span className="text-xl">{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>
      <div className="card card-pad">
        <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto_1fr]">
          <Field label="Valor">
            <Input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" className="text-lg font-bold" />
          </Field>
          <Field label="De">
            <Select value={from} onChange={(e) => setFrom(e.target.value)} options={keys.map((k) => ({ value: k, label: units[k].label }))} />
          </Field>
          <button onClick={() => { setFrom(to); setTo(from) }} className="icon-btn mb-1 bg-soft-purple text-brand-purple" aria-label="Intercambiar">
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <Field label="A">
            <Select value={to} onChange={(e) => setTo(e.target.value)} options={keys.map((k) => ({ value: k, label: units[k].label }))} />
          </Field>
        </div>
        <p className="mt-4 rounded-2xl bg-gradient-to-r from-pink-50 to-violet-50 px-4 py-3 text-center text-2xl font-extrabold text-ink dark:from-pink-950/30 dark:to-violet-950/30">
          {value || 0} {units[from]?.label.split(' ')[0]} = <span className="text-gradient">{result == null ? '—' : formatNumber(result, 8)}</span> {units[to]?.label.split(' ')[0]}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {table.map((r) => (
            <div key={r.k} className="flex justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm">
              <span className="text-ink-3">{r.label}</span>
              <b className="font-mono text-ink">{formatNumber(r.value, 8)}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
