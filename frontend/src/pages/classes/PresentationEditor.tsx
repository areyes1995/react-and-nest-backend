import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileDown,
  FolderOpen,
  HelpCircle,
  Image as ImageIcon,
  List,
  MonitorPlay,
  Plus,
  Save,
  Sigma,
  Table,
  Trash2,
  Type,
  Video,
  X,
} from 'lucide-react'
import { planningApi } from '@services/educraft'
import type { Presentation, Slide, SlideBlock } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Button, Field, Input, Latex, Popover, Select, Spinner, Textarea } from '@components/ui'
import { LAYOUT_THEME, SlideView, slidesToPpt } from '@/features/classes/SlideView'
import { blankSlide } from '@/features/classes/templates'
import { RESOURCE_MIME, ResourceExplorerDrawer } from '@/features/resources/ResourceExplorer'
import { exportPptx } from '@lib/exporters'
import { slugify } from '@lib/format'
import { cn } from '@lib/cn'

const BLOCK_TYPES: Array<{ type: SlideBlock['type']; label: string; icon: React.ReactNode; create: () => SlideBlock }> = [
  { type: 'text', label: 'Texto', icon: <Type className="h-4 w-4" />, create: () => ({ type: 'text', text: 'Nuevo texto' }) },
  { type: 'bullets', label: 'Lista', icon: <List className="h-4 w-4" />, create: () => ({ type: 'bullets', items: ['Punto 1', 'Punto 2'] }) },
  { type: 'formula', label: 'Fórmula', icon: <Sigma className="h-4 w-4" />, create: () => ({ type: 'formula', latex: '\\frac{a}{b} + \\frac{c}{d}' }) },
  { type: 'image', label: 'Imagen', icon: <ImageIcon className="h-4 w-4" />, create: () => ({ type: 'image', url: '', caption: '' }) },
  { type: 'video', label: 'Video', icon: <Video className="h-4 w-4" />, create: () => ({ type: 'video', url: '' }) },
  { type: 'question', label: 'Pregunta / encuesta', icon: <HelpCircle className="h-4 w-4" />, create: () => ({ type: 'question', prompt: '¿…?', options: ['Opción A', 'Opción B'] }) },
  { type: 'table', label: 'Tabla / cuadro comparativo', icon: <Table className="h-4 w-4" />, create: () => ({ type: 'table', rows: [['Concepto', 'Ejemplo'], ['', '']] }) },
]

export default function PresentationEditor() {
  const id = Number(useParams().id)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { success, error, confirm } = useFeedback()
  const [data, setData] = useState<Presentation | null>(null)
  const [current, setCurrent] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [presenting, setPresenting] = useState(params.get('proyectar') === '1')
  const [library, setLibrary] = useState(false)
  const [dropping, setDropping] = useState(false)

  useEffect(() => {
    planningApi.presentation(id).then(setData).catch((err) => error('No se pudo abrir', (err as Error).message))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const slides = data?.slides ?? []
  const slide = slides[current]

  const update = useCallback((patch: Partial<Presentation>) => {
    setData((d) => (d ? { ...d, ...patch } : d))
    setDirty(true)
  }, [])
  const setSlides = (next: Slide[]) => update({ slides: next })
  const setSlide = (patch: Partial<Slide>) => setSlides(slides.map((s, i) => (i === current ? { ...s, ...patch } : s)))
  const setBlock = (k: number, block: SlideBlock) => setSlide({ blocks: slide.blocks.map((b, i) => (i === k ? block : b)) })

  const save = async () => {
    if (!data) return
    setSaving(true)
    try {
      await planningApi.updatePresentation(id, { title: data.title, subtitle: data.subtitle ?? undefined, slides: data.slides })
      setDirty(false)
      success('Presentación guardada')
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // Proyección: flechas y Escape
  useEffect(() => {
    if (!presenting) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') setCurrent((c) => Math.min(slides.length - 1, c + 1))
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setCurrent((c) => Math.max(0, c - 1))
      if (e.key === 'Escape') setPresenting(false)
    }
    document.addEventListener('keydown', onKey)
    document.documentElement.requestFullscreen?.().catch(() => undefined)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
    }
  }, [presenting, slides.length])

  if (!data) return <Spinner />

  const onCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDropping(false)
    const raw = e.dataTransfer.getData(RESOURCE_MIME)
    if (!raw || !slide) return
    const r = JSON.parse(raw) as { title: string; url: string | null; category: string; mimeType: string | null }
    if (!r.url) return error('Recurso sin enlace público', 'Solo los recursos con enlace se pueden insertar en la diapositiva.')
    const block: SlideBlock =
      r.category === 'VIDEO' || /youtube|youtu\.be|vimeo/.test(r.url) ? { type: 'video', url: r.url } : r.category === 'IMAGE' || r.category === 'GEOMETRY' || /\.(png|jpe?g|gif|svg|webp)$/i.test(r.url) ? { type: 'image', url: r.url, caption: r.title } : { type: 'text', text: `${r.title}: ${r.url}` }
    setSlide({ blocks: [...slide.blocks, block] })
    success('Recurso agregado a la diapositiva')
  }

  if (presenting && slide) {
    return (
      <div className="fixed inset-0 z-[95] flex flex-col bg-[#141026]">
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-[min(100%,calc((100vh-6rem)*16/9))]">
            <SlideView slide={slide} number={current + 1} className="rounded-2xl" />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 pb-4 text-white/80">
          <button className="btn bg-white/10 text-white hover:bg-white/20" onClick={() => setCurrent((c) => Math.max(0, c - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm">
            {current + 1} / {slides.length} {slide.notes && <span className="ml-3 text-xs text-white/50">Notas: {slide.notes}</span>}
          </span>
          <div className="flex gap-2">
            <button className="btn bg-white/10 text-white hover:bg-white/20" onClick={() => setCurrent((c) => Math.min(slides.length - 1, c + 1))}>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button className="btn bg-white/10 text-white hover:bg-white/20" onClick={() => setPresenting(false)}>
              <X className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
      </div>
    )
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= slides.length) return
    const next = [...slides]
    const [s] = next.splice(from, 1)
    next.splice(to, 0, s)
    setSlides(next)
    setCurrent(to)
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button onClick={() => navigate('/app/clases')} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-2 hover:text-brand-purple">
          <ArrowLeft className="h-4 w-4" /> Clases
        </button>
        <Input value={data.title} onChange={(e) => update({ title: e.target.value })} className="h-9 max-w-sm font-bold" />
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={<FolderOpen className="h-3.5 w-3.5" />} onClick={() => setLibrary(true)}>
            Recursos
          </Button>
          <Button variant="secondary" size="sm" icon={<FileDown className="h-3.5 w-3.5" />} onClick={() => exportPptx(data.title, slidesToPpt(slides), slugify(data.title) || 'presentacion')}>
            PowerPoint
          </Button>
          <Button variant="secondary" size="sm" icon={<MonitorPlay className="h-3.5 w-3.5" />} onClick={() => setPresenting(true)}>
            Proyectar
          </Button>
          <Button size="sm" icon={<Save className="h-3.5 w-3.5" />} onClick={save} loading={saving} disabled={!dirty}>
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[11rem_1fr_22rem]">
        {/* Miniaturas */}
        <div className="flex gap-2 overflow-x-auto xl:max-h-[calc(100vh-10rem)] xl:flex-col xl:overflow-y-auto xl:pr-1">
          {slides.map((s, i) => (
            <button key={s.id} onClick={() => setCurrent(i)} className={cn('w-40 shrink-0 rounded-xl p-0.5 transition xl:w-full', i === current ? 'ring-2 ring-brand-pink' : 'opacity-80 hover:opacity-100')}>
              <SlideView slide={s} number={i + 1} />
            </button>
          ))}
          <Popover
            align="left"
            width="w-56"
            trigger={({ toggle }) => (
              <button onClick={toggle} className="grid aspect-video w-40 shrink-0 place-items-center rounded-xl border-2 border-dashed border-line text-ink-3 hover:border-violet-300 hover:text-brand-purple xl:w-full">
                <Plus className="h-5 w-5" />
              </button>
            )}
          >
            {(close) => (
              <div className="p-2">
                {Object.entries(LAYOUT_THEME).map(([layout, t]) => (
                  <button
                    key={layout}
                    onClick={() => {
                      setSlides([...slides.slice(0, current + 1), blankSlide(layout), ...slides.slice(current + 1)])
                      setCurrent(current + 1)
                      close()
                    }}
                    className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-ink-2 hover:bg-surface-3"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </Popover>
        </div>

        {/* Lienzo */}
        <div
          className={cn('min-w-0 space-y-2 rounded-2xl transition', dropping && 'ring-4 ring-pink-300')}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes(RESOURCE_MIME)) {
              e.preventDefault()
              setDropping(true)
            }
          }}
          onDragLeave={() => setDropping(false)}
          onDrop={onCanvasDrop}
        >
          {slide ? <SlideView slide={slide} number={current + 1} /> : <div className="grid aspect-video place-items-center rounded-2xl border border-dashed border-line text-ink-3">Sin diapositivas</div>}
          <p className="text-center text-xs text-ink-3">Arrastra recursos de la biblioteca sobre la diapositiva para insertarlos.</p>
        </div>

        {/* Propiedades */}
        {slide && (
          <div className="card card-pad space-y-3 xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="section-title">Diapositiva {current + 1}</p>
              <div className="flex gap-1">
                <button className="icon-btn h-8 w-8" onClick={() => move(current, current - 1)} aria-label="Subir">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button className="icon-btn h-8 w-8" onClick={() => move(current, current + 1)} aria-label="Bajar">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  className="icon-btn h-8 w-8"
                  onClick={() => {
                    const copy = { ...structuredClone(slide), id: `${slide.id}c${Date.now()}` }
                    setSlides([...slides.slice(0, current + 1), copy, ...slides.slice(current + 1)])
                    setCurrent(current + 1)
                  }}
                  aria-label="Duplicar"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  className="icon-btn h-8 w-8 hover:text-brand-red"
                  onClick={async () => {
                    if (slides.length <= 1) return
                    if (await confirm({ title: 'Eliminar diapositiva', danger: true, confirmLabel: 'Eliminar' })) {
                      setSlides(slides.filter((_, i) => i !== current))
                      setCurrent(Math.max(0, current - 1))
                    }
                  }}
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <Field label="Diseño">
              <Select value={slide.layout} onChange={(e) => setSlide({ layout: e.target.value })} options={Object.entries(LAYOUT_THEME).map(([v, t]) => ({ value: v, label: t.label }))} />
            </Field>
            <Field label="Título">
              <Input value={slide.title} onChange={(e) => setSlide({ title: e.target.value })} />
            </Field>
            <Field label="Subtítulo">
              <Input value={slide.subtitle ?? ''} onChange={(e) => setSlide({ subtitle: e.target.value || undefined })} />
            </Field>

            <div className="space-y-2">
              <p className="label">Bloques</p>
              {slide.blocks.map((b, k) => (
                <BlockEditor
                  key={k}
                  block={b}
                  onChange={(nb) => setBlock(k, nb)}
                  onRemove={() => setSlide({ blocks: slide.blocks.filter((_, i) => i !== k) })}
                  onMove={(dir) => {
                    const to = k + dir
                    if (to < 0 || to >= slide.blocks.length) return
                    const next = [...slide.blocks]
                    ;[next[k], next[to]] = [next[to], next[k]]
                    setSlide({ blocks: next })
                  }}
                />
              ))}
              <div className="grid grid-cols-2 gap-1.5">
                {BLOCK_TYPES.map((t) => (
                  <button key={t.type} onClick={() => setSlide({ blocks: [...slide.blocks, t.create()] })} className="chip justify-start">
                    {t.icon} {t.label}
                  </button>
                ))}
                <button onClick={() => setSlide({ blocks: [...slide.blocks, { type: 'question', prompt: 'Encuesta rápida: ¿Qué tan claro fue el tema?', options: ['Muy claro', 'Algo claro', 'Necesito repaso'] }] })} className="chip justify-start">
                  <BarChart3 className="h-4 w-4" /> Encuesta
                </button>
              </div>
            </div>
            <Field label="Notas del docente">
              <Textarea rows={2} value={slide.notes ?? ''} onChange={(e) => setSlide({ notes: e.target.value || undefined })} />
            </Field>
          </div>
        )}
      </div>
      <ResourceExplorerDrawer open={library} onClose={() => setLibrary(false)} />
    </div>
  )
}

function BlockEditor({ block, onChange, onRemove, onMove }: { block: SlideBlock; onChange: (b: SlideBlock) => void; onRemove: () => void; onMove: (dir: -1 | 1) => void }) {
  const label = BLOCK_TYPES.find((t) => t.type === block.type)?.label ?? block.type
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[0.68rem] font-bold uppercase tracking-wide text-ink-3">{label}</span>
        <div className="flex">
          <button className="icon-btn h-6 w-6" onClick={() => onMove(-1)} aria-label="Subir bloque">
            <ArrowUp className="h-3 w-3" />
          </button>
          <button className="icon-btn h-6 w-6" onClick={() => onMove(1)} aria-label="Bajar bloque">
            <ArrowDown className="h-3 w-3" />
          </button>
          <button className="icon-btn h-6 w-6 hover:text-brand-red" onClick={onRemove} aria-label="Quitar bloque">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      {block.type === 'text' && <Textarea rows={2} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />}
      {block.type === 'bullets' && <Textarea rows={3} value={block.items.join('\n')} onChange={(e) => onChange({ ...block, items: e.target.value.split('\n') })} />}
      {block.type === 'formula' && (
        <>
          <Input value={block.latex} onChange={(e) => onChange({ ...block, latex: e.target.value })} className="font-mono text-xs" />
          <div className="mt-1 rounded-lg bg-surface p-1 text-center">
            <Latex>{block.latex}</Latex>
          </div>
        </>
      )}
      {block.type === 'image' && (
        <div className="space-y-1.5">
          <Input value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} placeholder="URL de la imagen" />
          <Input value={block.caption ?? ''} onChange={(e) => onChange({ ...block, caption: e.target.value })} placeholder="Pie de imagen" />
        </div>
      )}
      {block.type === 'video' && <Input value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} placeholder="URL de YouTube o video" />}
      {block.type === 'question' && (
        <div className="space-y-1.5">
          <Input value={block.prompt} onChange={(e) => onChange({ ...block, prompt: e.target.value })} />
          <Textarea rows={2} value={(block.options ?? []).join('\n')} onChange={(e) => onChange({ ...block, options: e.target.value.split('\n').filter((x, i, arr) => x || i < arr.length - 1) })} placeholder="Opciones (una por línea)" />
        </div>
      )}
      {block.type === 'table' && (
        <Textarea
          rows={3}
          value={block.rows.map((r) => r.join(' | ')).join('\n')}
          onChange={(e) => onChange({ ...block, rows: e.target.value.split('\n').map((l) => l.split('|').map((c) => c.trim())) })}
          placeholder="Celdas separadas por | y filas por línea"
        />
      )}
    </div>
  )
}
