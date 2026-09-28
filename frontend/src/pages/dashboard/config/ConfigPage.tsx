// ──────────────────────────────────────────────
// ConfigPage — Gestión de catálogos configurables (§2.1)
// Pabellones temáticos: reemplaza PROJECT_AREAS hardcodeado
// con CRUD dinámico en /config/catalogs (solo ADMIN).
// ──────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, RefreshCw, Layers, Palette, Tag, Hash } from 'lucide-react'
import {
  listPavilions,
  createPavilion,
  updatePavilion,
  deletePavilion,
  type PavilionArea,
  type PavilionPayload,
  type UpdatePavilionPayload,
} from '@services/catalogs'
import Modal from '@components/ui/modal/Modal'
import ModalHeader from '@components/ui/modal/ModalHeader'
import ModalBody from '@components/ui/modal/ModalBody'
import {
  FormField,
  FormInput,
  FormTextarea,
  FormAlert,
} from '@components/ui/form'
import StatsGrid from '@components/ui/cards/StatsGrid'
import Toast, { type ToastData } from '@components/ui/feedback/Toast'
import { ConfirmDeleteModal } from '@components/ui/modal'

const ICON_OPTIONS = ['cpu', 'code', 'shield', 'spark', 'atom', 'layers', 'globe', 'rocket']

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed border-[var(--border)] rounded-xl bg-[var(--bg-surface-soft)]/50">
      <Layers className="w-10 h-10 text-[var(--text-muted)]" />
      <p className="text-sm font-medium text-[var(--text-primary)]">Sin pabellones temáticos</p>
      <p className="text-xs text-[var(--text-muted)] max-w-sm text-center">Los pabellones organizan los proyectos por área (IA, Software, Ciberseguridad, IoT…). Crea el primero o espera el seed inicial.</p>
      <button onClick={onCreate} className="mt-2 px-4 py-2 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">Nuevo pabellón</button>
    </div>
  )
}

interface FormState {
  key: string
  label: string
  pavilion: string
  tagline: string
  description: string
  accent: string
  icon: string
  keywords: string
  sortOrder: string
  isActive: boolean
}

const EMPTY_FORM: FormState = {
  key: '',
  label: '',
  pavilion: '',
  tagline: '',
  description: '',
  accent: '#5b8cff',
  icon: 'atom',
  keywords: '',
  sortOrder: '0',
  isActive: true,
}

function pavilionToForm(p: PavilionArea | null): FormState {
  if (!p) return { ...EMPTY_FORM }
  return {
    key: p.key,
    label: p.label,
    pavilion: p.pavilion,
    tagline: p.tagline ?? '',
    description: p.description ?? '',
    accent: p.accent ?? '#5b8cff',
    icon: p.icon ?? 'atom',
    keywords: (p.keywords ?? []).join(', '),
    sortOrder: String(p.sortOrder ?? 0),
    isActive: p.isActive ?? true,
  }
}

export default function ConfigPage() {
  const [pavilions, setPavilions] = useState<PavilionArea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PavilionArea | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PavilionArea | null>(null)
  const [deleting, setDeleting] = useState(false)

  const showToast = useCallback((t: ToastData) => {
    setToast(t)
    window.setTimeout(() => setToast(null), 3500)
  }, [])

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listPavilions(true)
      if (!res.ok) throw new Error(res.error || 'No se pudo cargar el catálogo de pabellones')
      setPavilions(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetch()
  }, [fetch])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (p: PavilionArea) => {
    setEditing(p)
    setForm(pavilionToForm(p))
    setFormError(null)
    setShowForm(true)
  }

  const closeForm = () => {
    if (submitting) return
    setShowForm(false)
    setEditing(null)
    setFormError(null)
  }

  const setField = (k: keyof FormState, v: string | boolean) => {
    setForm(prev => ({ ...prev, [k]: v as never }))
    if (formError) setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!form.label.trim()) {
      setFormError('El nombre del área es obligatorio')
      return
    }
    if (!editing && !form.key.trim()) {
      setFormError('La clave es obligatoria (ej: IA, SOFTWARE)')
      return
    }
    if (form.key && !/^[A-Z0-9_]+$/i.test(form.key.trim())) {
      setFormError('La clave solo admite letras, números y _')
      return
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(form.accent.trim())) {
      setFormError('El color debe ser hex #RRGGBB (ej: #7c5cff)')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      if (editing) {
        const payload: UpdatePavilionPayload = {
          label: form.label.trim(),
          pavilion: form.pavilion.trim() || `Pabellón ${form.label.trim()}`,
          tagline: form.tagline.trim() || undefined,
          description: form.description.trim() || undefined,
          accent: form.accent.trim(),
          icon: form.icon.trim() || 'atom',
          keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
          sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive,
        }
        const res = await updatePavilion(editing.id, payload)
        if (!res.ok) throw new Error(res.error || 'No se pudo actualizar el pabellón')
        setPavilions(prev => prev.map(p => (p.id === editing.id ? res.data : p)))
        showToast({ type: 'success', message: 'Pabellón actualizado' })
      } else {
        const payload: PavilionPayload = {
          key: form.key.trim().toUpperCase(),
          label: form.label.trim(),
          pavilion: form.pavilion.trim() || `Pabellón ${form.label.trim()}`,
          tagline: form.tagline.trim() || undefined,
          description: form.description.trim() || undefined,
          accent: form.accent.trim(),
          icon: form.icon.trim() || 'atom',
          keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
          sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive,
        }
        const res = await createPavilion(payload)
        if (!res.ok) throw new Error(res.error || 'No se pudo crear el pabellón')
        setPavilions(prev => [...prev, res.data].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)))
        showToast({ type: 'success', message: 'Pabellón creado' })
      }
      setShowForm(false)
      setEditing(null)
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await deletePavilion(deleteTarget.id)
      if (!res.ok) throw new Error(res.error || 'No se pudo eliminar')
      setPavilions(prev => prev.filter(p => p.id !== deleteTarget.id))
      showToast({ type: 'success', message: `Pabellón «${deleteTarget.label}» eliminado` })
      setDeleteTarget(null)
    } catch (e) {
      showToast({ type: 'error', message: (e as Error).message })
    } finally {
      setDeleting(false)
    }
  }

  const toggleActive = async (p: PavilionArea) => {
    try {
      const res = await updatePavilion(p.id, { isActive: !p.isActive })
      if (!res.ok) throw new Error(res.error || 'No se pudo cambiar el estado')
      setPavilions(prev => prev.map(x => (x.id === p.id ? res.data : x)))
      showToast({ type: 'success', message: res.data.isActive ? 'Pabellón activado' : 'Pabellón desactivado' })
    } catch (e) {
      showToast({ type: 'error', message: (e as Error).message })
    }
  }

  const stats = {
    total: pavilions.length,
    activos: pavilions.filter(p => p.isActive).length,
    inactivos: pavilions.filter(p => !p.isActive).length,
  }

  return (
    <div className="flex flex-col h-full">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
        <Toast toast={toast} />

        {/* Header */}
        <div className="px-4 lg:px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                Catálogos — Pabellones temáticos
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-2xl">
                Gestiona las áreas temáticas (pabellones) del metaverso sin redeploy. Cada <em>category</em> de proyecto mapea a un pabellón por su <code className="px-1 py-0.5 rounded bg-[var(--bg-surface-soft)] border border-[var(--border)] text-mini">label</code>.
                Al publicar, el stand se crea en la sala del pabellón correspondiente.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => fetch()} title="Recargar" aria-label="Recargar" className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 whitespace-nowrap">
                <Plus className="w-4 h-4" /> Nuevo pabellón
              </button>
            </div>
          </div>

          <div className="mt-4">
            <StatsGrid
              items={[
                { label: 'Total', value: stats.total },
                { label: 'Activos', value: stats.activos, accentClass: 'text-emerald-400' },
                { label: 'Inactivos', value: stats.inactivos, accentClass: 'text-amber-400' },
              ]}
            />
          </div>

          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-caption text-amber-200">
            <strong>Nota:</strong> Cambiar el <em>label</em> (ej: “Inteligencia Artificial”) afecta la clasificación de nuevos proyectos. Los proyectos ya creados mantienen su <code>category</code> hasta que se editen. Usa <em>Desactivar</em> en lugar de eliminar si el pabellón tiene proyectos asociados.
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-soft)] animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300">
              <p className="font-medium">Error cargando pabellones</p>
              <p className="text-xs opacity-80 mt-1">{error}</p>
              <button onClick={() => fetch()} className="mt-3 px-3 py-1.5 text-xs rounded-lg border border-red-400/40 hover:bg-red-500/20">Reintentar</button>
            </div>
          ) : pavilions.length === 0 ? (
            <EmptyState onCreate={openCreate} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-panel)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-surface-soft)]">
                    <th className="text-left py-3 px-3 text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">Key</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">Área / Pabellón</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-[var(--text-muted)] hidden lg:table-cell">Tagline</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">Acento</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-[var(--text-muted)] hidden md:table-cell">Keywords</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">Orden</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">Estado</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pavilions
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
                    .map(p => (
                      <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-surface-soft)] transition-colors">
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-surface-soft)] border border-[var(--border)] text-[var(--text-primary)]">
                            <Hash className="w-3 h-3 text-[var(--text-muted)]" />
                            {p.key}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-[var(--text-primary)] text-xs">{p.label}</div>
                          <div className="text-caption text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                            <Tag className="w-3 h-3" />
                            {p.pavilion}
                          </div>
                        </td>
                        <td className="py-3 px-3 hidden lg:table-cell max-w-xs">
                          <div className="text-xs text-[var(--text-secondary)] truncate">{p.tagline || '—'}</div>
                          <div className="text-caption text-[var(--text-muted)] truncate">{p.description || ''}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span className="w-4 h-4 rounded border border-white/10 inline-block" style={{ background: p.accent }} />
                            <span className="font-mono text-caption text-[var(--text-muted)]">{p.accent}</span>
                            <Palette className="w-3 h-3 text-[var(--text-muted)] hidden sm:inline" />
                          </span>
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell max-w-[12.5rem]">
                          <div className="flex flex-wrap gap-1">
                            {(p.keywords ?? []).slice(0, 4).map(k => (
                              <span key={k} className="text-mini px-1.5 py-0.5 rounded bg-[var(--bg-surface-soft)] border border-[var(--border)] text-[var(--text-muted)]">{k}</span>
                            ))}
                            {(p.keywords?.length ?? 0) > 4 && <span className="text-mini text-[var(--text-muted)]">+{p.keywords.length - 4}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-[var(--text-secondary)]">{p.sortOrder}</td>
                        <td className="py-3 px-3">
                          <button onClick={() => toggleActive(p)} title={p.isActive ? 'Desactivar' : 'Activar'} className={`text-caption px-2 py-0.5 rounded-full border ${p.isActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
                            {p.isActive ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(p)} title="Editar" className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(p)} title="Eliminar" className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form modal */}
        <Modal isOpen={showForm} onClose={closeForm} maxWidth="max-w-2xl" maxHeight="max-h-[92vh]">
          <ModalHeader title={editing ? `Editar pabellón — ${editing.label}` : 'Nuevo pabellón temático'} subtitle={editing ? 'Los cambios se reflejan en el próximo publish y en el orden del metaverso.' : 'Define un área que agrupará proyectos y su sala en el metaverso.'} onClose={closeForm} />
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <ModalBody>
              <div className="flex flex-col gap-4">
                {formError && <FormAlert variant="error">{formError}</FormAlert>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Clave (key)" htmlFor="pav-key" error={!editing && formError?.includes('clave') ? formError : undefined}>
                    <FormInput id="pav-key" name="key" value={form.key} onChange={e => setField('key', e.target.value)} placeholder="IA" disabled={!!editing || submitting} hasError={!!formError?.includes('clave')} />
                    {editing && <p className="text-caption text-[var(--text-muted)]">La clave no se puede cambiar para no romper mapeos existentes.</p>}
                  </FormField>
                  <FormField label="Etiqueta del área (label)" htmlFor="pav-label">
                    <FormInput id="pav-label" name="label" value={form.label} onChange={e => setField('label', e.target.value)} placeholder="Inteligencia Artificial" disabled={submitting} />
                  </FormField>
                </div>
                <FormField label="Nombre del pabellón" htmlFor="pav-pavilion">
                  <FormInput id="pav-pavilion" name="pavilion" value={form.pavilion} onChange={e => setField('pavilion', e.target.value)} placeholder="Pabellón Inteligencia Artificial" disabled={submitting} />
                </FormField>
                <FormField label="Tagline (frase corta)" htmlFor="pav-tagline">
                  <FormInput id="pav-tagline" name="tagline" value={form.tagline} onChange={e => setField('tagline', e.target.value)} placeholder="Modelos que aprenden…" disabled={submitting} />
                </FormField>
                <FormField label="Descripción" htmlFor="pav-desc">
                  <FormTextarea id="pav-desc" name="description" value={form.description} onChange={e => setField('description', e.target.value as never)} rows={3} placeholder="Qué agrupa este pabellón…" disabled={submitting} />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="Color de acento" htmlFor="pav-accent">
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.accent} onChange={e => setField('accent', e.target.value)} className="h-9 w-9 rounded border border-[var(--border)] bg-transparent p-1" disabled={submitting} />
                      <FormInput id="pav-accent" name="accent" value={form.accent} onChange={e => setField('accent', e.target.value)} placeholder="#7c5cff" disabled={submitting} />
                    </div>
                  </FormField>
                  <FormField label="Icono" htmlFor="pav-icon">
                    <select id="pav-icon" value={form.icon} onChange={e => setField('icon', e.target.value)} disabled={submitting} className="w-full px-3 py-2 text-xs bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none">
                      {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Orden" htmlFor="pav-order">
                    <FormInput id="pav-order" name="sortOrder" type="number" value={form.sortOrder} onChange={e => setField('sortOrder', e.target.value)} placeholder="0" disabled={submitting} />
                  </FormField>
                </div>
                <FormField label="Keywords (separadas por coma, para mapeo legacy)" htmlFor="pav-keywords">
                  <FormInput id="pav-keywords" name="keywords" value={form.keywords} onChange={e => setField('keywords', e.target.value)} placeholder="ia, machine learning, datos" disabled={submitting} />
                </FormField>
                <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setField('isActive', e.target.checked)} disabled={submitting} className="h-4 w-4 accent-blue-500" />
                  Activo (visible para nuevos proyectos y en el metaverso)
                </label>
              </div>
            </ModalBody>
            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-surface-soft)] flex justify-end gap-2">
              <button type="button" onClick={closeForm} disabled={submitting} className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50">Cancelar</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
                {submitting ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear pabellón'}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          title="Eliminar pabellón"
          itemName={deleteTarget?.label}
          description="Esta acción no se puede deshacer. Si el pabellón tiene proyectos o salas asociadas, preferible desactivarlo."
          confirming={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  )
}
