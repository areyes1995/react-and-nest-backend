import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, ExternalLink, FileText, Folder, Image as ImageIcon, Link2, Pencil, Search, Trash2, UploadCloud, Video } from 'lucide-react'
import { libraryApi } from '@services/educraft'
import type { LibraryResource, ResourceCategory } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useAsync } from '@hooks/useAsync'
import { useDebounce } from '@hooks/useDebounce'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Spinner, TONE_CLASSES } from '@components/ui'
import { RESOURCE_CATEGORIES } from '@lib/labels'
import { downloadBlob, formatBytes, formatDate } from '@lib/format'
import { cn } from '@lib/cn'

const FOLDERS: ResourceCategory[] = ['IMAGE', 'GEOMETRY', 'CHART', 'VIDEO', 'PDF', 'TEMPLATE', 'ILLUSTRATION', 'ICON', 'BACKGROUND', 'ANIMATION', 'OWN']

function guessCategory(file: File): ResourceCategory {
  if (file.type.startsWith('image/')) return 'IMAGE'
  if (file.type.startsWith('video/')) return 'VIDEO'
  if (file.type === 'application/pdf') return 'PDF'
  return 'OWN'
}

/** Miniatura: para archivos subidos se descarga con la sesión y se crea un object URL. */
function Thumb({ r }: { r: LibraryResource }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let url: string | null = null
    if (r.storageKey && r.mimeType?.startsWith('image/')) {
      libraryApi
        .file(r.id)
        .then((blob) => {
          url = URL.createObjectURL(blob)
          setSrc(url)
        })
        .catch(() => undefined)
    } else if (r.url && /\.(png|jpe?g|gif|svg|webp)$/i.test(r.url)) setSrc(r.url)
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [r])
  if (src) return <img src={src} alt={r.title} className="h-full w-full object-cover" />
  const icon = r.category === 'VIDEO' ? <Video className="h-8 w-8" /> : r.category === 'PDF' ? <FileText className="h-8 w-8" /> : r.url ? <Link2 className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />
  return <div className={cn('grid h-full w-full place-items-center', TONE_CLASSES[RESOURCE_CATEGORIES[r.category].tone])}>{icon}</div>
}

export default function ResourcesPage() {
  const [params, setParams] = useSearchParams()
  const { success, error, confirm } = useFeedback()
  const category = (params.get('carpeta') as ResourceCategory) || ''
  const [q, setQ] = useState(params.get('q') ?? '')
  const term = useDebounce(q, 250)
  const { data, loading, reload } = useAsync(() => libraryApi.list({ category: category || undefined, q: term || undefined }), [category, term])
  const summary = useAsync(() => libraryApi.summary())
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [editing, setEditing] = useState<LibraryResource | null>(null)
  const [link, setLink] = useState({ title: '', url: '', category: 'VIDEO' as ResourceCategory, tags: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (!list.length) return
    setUploading({ done: 0, total: list.length })
    let ok = 0
    for (const [i, file] of list.entries()) {
      try {
        await libraryApi.create({ title: file.name.replace(/\.[^.]+$/, ''), category: category || guessCategory(file), file })
        ok++
      } catch (err) {
        error(`No se pudo subir ${file.name}`, (err as Error).message)
      }
      setUploading({ done: i + 1, total: list.length })
    }
    setUploading(null)
    if (ok) success('Carga completada', `${ok} archivo(s) agregados a la biblioteca`)
    void reload()
    void summary.reload()
  }

  const saveLink = async () => {
    if (!link.title.trim() || !link.url.trim()) return
    try {
      await libraryApi.create({ title: link.title, url: link.url, category: link.category, tags: link.tags.split(',').map((t) => t.trim()).filter(Boolean) })
      setLinkOpen(false)
      setLink({ title: '', url: '', category: 'VIDEO', tags: '' })
      success('Recurso agregado')
      void reload()
      void summary.reload()
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    }
  }

  const saveEdit = async () => {
    if (!editing) return
    try {
      await libraryApi.update(editing.id, { title: editing.title, description: editing.description, category: editing.category, tags: editing.tags })
      setEditing(null)
      void reload()
      void summary.reload()
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    }
  }

  const total = Object.values(summary.data ?? {}).reduce((a, b) => a + (b ?? 0), 0)

  return (
    <div>
      <PageHeader
        title="Biblioteca de recursos"
        subtitle="Repositorio organizado por categorías, con etiquetas para encontrar todo rápido"
        actions={
          <>
            <Button variant="secondary" icon={<Link2 className="h-4 w-4" />} onClick={() => setLinkOpen(true)}>
              Agregar enlace
            </Button>
            <Button icon={<UploadCloud className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
              Subir archivos
            </Button>
          </>
        }
      />
      <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />

      <div className="grid gap-4 xl:grid-cols-[16rem_1fr]">
        <Card className="card-pad h-fit">
          <p className="section-title mb-2">Carpetas</p>
          <ul className="space-y-0.5">
            <li>
              <button onClick={() => setParams({})} className={cn('flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm', !category ? 'bg-soft-purple font-bold text-brand-purple' : 'text-ink-2 hover:bg-surface-3')}>
                <span className="flex items-center gap-2">
                  <Folder className="h-4 w-4" /> Todos
                </span>
                <span className="text-xs">{total}</span>
              </button>
            </li>
            {FOLDERS.map((c) => (
              <li key={c}>
                <button onClick={() => setParams({ carpeta: c })} className={cn('flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm', category === c ? 'bg-soft-purple font-bold text-brand-purple' : 'text-ink-2 hover:bg-surface-3')}>
                  <span className="flex items-center gap-2">
                    <Folder className="h-4 w-4" /> {RESOURCE_CATEGORIES[c].label}
                  </span>
                  <span className="text-xs">{summary.data?.[c] ?? 0}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="min-w-0 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              void uploadFiles(e.dataTransfer.files)
            }}
            onClick={() => fileRef.current?.click()}
            className={cn('flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 border-dashed p-6 text-center transition', dragging ? 'border-brand-pink bg-soft-pink' : 'border-violet-200 bg-surface hover:bg-surface-2 dark:border-violet-900')}
          >
            <UploadCloud className="h-8 w-8 text-brand-purple" />
            <p className="text-sm font-semibold text-ink">{uploading ? `Subiendo ${uploading.done}/${uploading.total}…` : 'Arrastra aquí tus PDF, imágenes o videos para cargarlos en masa'}</p>
            <p className="text-xs text-ink-3">{category ? `Se guardarán en “${RESOURCE_CATEGORIES[category].label}”` : 'La carpeta se asigna según el tipo de archivo'} · máx. 25 MB por archivo</p>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título o etiqueta" className="input pl-9" />
          </div>

          {loading && !data ? (
            <Spinner />
          ) : !data?.length ? (
            <Card className="card-pad">
              <EmptyState title="Sin recursos" description="Sube materiales o agrega enlaces a videos, simuladores y documentos." />
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {data.map((r) => (
                <div key={r.id} className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
                  <div className="aspect-video overflow-hidden">
                    <Thumb r={r} />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-bold text-ink" title={r.title}>
                      {r.title}
                    </p>
                    <p className="text-[0.68rem] text-ink-3">
                      {RESOURCE_CATEGORIES[r.category].label} · {formatDate(r.updatedAt)} {r.sizeBytes ? `· ${formatBytes(r.sizeBytes)}` : ''}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {r.tags.map((t) => (
                        <button key={t} onClick={() => setQ(t)}>
                          <Badge>#{t}</Badge>
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-1">
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noreferrer" className="icon-btn h-8 w-8" aria-label="Abrir">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {r.storageKey && (
                        <button className="icon-btn h-8 w-8" aria-label="Descargar" onClick={async () => downloadBlob(await libraryApi.file(r.id), r.fileName ?? r.title)}>
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      <button className="icon-btn h-8 w-8" aria-label="Editar" onClick={() => setEditing(r)}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="icon-btn ml-auto h-8 w-8 hover:text-brand-red"
                        aria-label="Eliminar"
                        onClick={async () => {
                          if (await confirm({ title: 'Eliminar recurso', description: `¿Eliminar “${r.title}”?`, danger: true, confirmLabel: 'Eliminar' })) {
                            await libraryApi.remove(r.id)
                            void reload()
                            void summary.reload()
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={linkOpen} onClose={() => setLinkOpen(false)} title="Agregar enlace" footer={<Button onClick={saveLink}>Guardar</Button>}>
        <div className="space-y-3">
          <Field label="Título">
            <Input value={link.title} onChange={(e) => setLink({ ...link, title: e.target.value })} />
          </Field>
          <Field label="Enlace">
            <Input value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} placeholder="https://" />
          </Field>
          <Field label="Carpeta">
            <Select value={link.category} onChange={(e) => setLink({ ...link, category: e.target.value as ResourceCategory })} options={FOLDERS.map((c) => ({ value: c, label: RESOURCE_CATEGORIES[c].label }))} />
          </Field>
          <Field label="Etiquetas" hint="Separadas por coma: fracciones, 1ro, geogebra">
            <Input value={link.tags} onChange={(e) => setLink({ ...link, tags: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar recurso" footer={<Button onClick={saveEdit}>Guardar</Button>}>
        {editing && (
          <div className="space-y-3">
            <Field label="Título">
              <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </Field>
            <Field label="Carpeta">
              <Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as ResourceCategory })} options={FOLDERS.map((c) => ({ value: c, label: RESOURCE_CATEGORIES[c].label }))} />
            </Field>
            <Field label="Etiquetas" hint="Separadas por coma">
              <Input value={editing.tags.join(', ')} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) })} />
            </Field>
            <Field label="Descripción">
              <Input value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
