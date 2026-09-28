import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Loader2,
  Table2,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Expandable } from '@components/ui'
import { useReloadNotification } from '@context/ReloadNotificationContext'
import { useAppTranslation } from '@i18n/useAppTranslation'
import { jsonConfig, type ColumnType, type ViewOption, type BaseModule } from '@services/json-config'

const DEV_MODE_KEY = 'modu_dev_mode'
function getDevMode(): boolean {
  const stored = localStorage.getItem(DEV_MODE_KEY)
  if (stored === null) return false
  return stored === 'true'
}

function confirmDelete(label: string): boolean {
  return window.confirm(`Are you sure you want to delete "${label}"?\n\nThis action cannot be undone.`)
}

type Step = 'modules' | 'basic' | 'columns' | 'views' | 'chart'

interface StepConfig {
  label: string
  step: Step
  description: string
}

const STEPS: StepConfig[] = [
  { label: 'createModule.stepModules', step: 'modules', description: 'View existing modules and select one to edit, or create a new module' },
  { label: 'createModule.stepBasic', step: 'basic', description: 'Define the name, URL slug, icon and color of your module' },
  { label: 'createModule.stepColumns', step: 'columns', description: 'Add data columns that will appear as table headers (text, number, date, select, list)' },
  { label: 'createModule.stepViews', step: 'views', description: 'Create predefined views (summary or chart) to organize and display your records' },
  { label: 'createModule.stepChart', step: 'chart', description: 'Configure a chart visualization for your data (bar, line, pie, area)' },
]

interface FormState {
  id?: string
  label: string
  slug: string
  color: string
  icon: string
  columns: ColumnType[]
  viewOptions: ViewOption[]
  charts: { type: string; label: string; xAxis: string; yAxis: string; series?: string }[]
}

interface FormStateWithMeta extends FormState {
  _slugManuallyEdited?: boolean
}

interface ColumnFormState {
  key: string
  header: string
  type: string
  options: string[]
  chartGroup: boolean
}

interface ViewFormState {
  label: string
  slug: string
  description: string
  kind: string
}

interface ChartFormState {
  label: string
  type: string
  xAxisColumn: string
  yAxisColumn: string
  seriesColumn: string
}

interface CombinedModule {
  source: 'base' | 'custom'
  data: BaseModule
}

const CHART_TYPES = [
  { value: 'BAR', label: 'Bar Chart' },
  { value: 'LINE', label: 'Line Chart' },
  { value: 'PIE', label: 'Pie Chart' },
  { value: 'AREA', label: 'Area Chart' },
]

const COLUMN_TYPES: { value: string; label: string }[] = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATE', label: 'Date' },
  { value: 'SELECT', label: 'Select' },
  { value: 'LIST', label: 'List' },
]

const VIEW_KINDS: { value: string; label: string }[] = [
  { value: 'SUMMARY', label: 'Summary' },
  { value: 'TABLE', label: 'Table' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'UPLOAD', label: 'Upload' },
]

export default function CreateModuleView() {
  const navigate = useNavigate()
  const { t } = useAppTranslation()
  const { showReloadNotification } = useReloadNotification()
  const [stepIndex, setStepIndex] = useState(0)
  const [devMode] = useState(getDevMode)
  const [form, setForm] = useState<FormStateWithMeta>({
    label: '',
    slug: '',
    color: 'blue',
    icon: 'LayoutGrid',
    columns: [],
    viewOptions: [],
    charts: [],
    _slugManuallyEdited: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [combinedModules, setCombinedModules] = useState<CombinedModule[]>([])
  const [modulesLoaded, setModulesLoaded] = useState(false)
  const [editingCustomModuleSlug, setEditingCustomModuleSlug] = useState<string | null>(null)
  const [_loadingModule, setLoadingModule] = useState(false)
  const [componentTypes, setComponentTypes] = useState<{
    colors: { value: string; label: string }[]
    icons: { value: string; label: string }[]
  }>({ colors: [], icons: [] })
  const [moduleSelected, setModuleSelected] = useState(false)
  const [moduleSource, setModuleSource] = useState<'base' | 'custom' | null>(null)

  const currentStep = STEPS[stepIndex].step
  const currentStepLabel = t(STEPS[stepIndex].label)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      jsonConfig.getSystemModules(),
      jsonConfig.getComponentTypes(),
      jsonConfig.getCustomModules(),
    ]).then(async ([systemModules, types, customModules]) => {
      if (cancelled) return
      const customBaseMap = new Map<string, BaseModule>()
      for (const mod of customModules) {
        if (mod.source === 'base') {
          customBaseMap.set(mod.slug, mod)
        }
      }
      const combined: CombinedModule[] = []
      for (const module of systemModules) {
        const customBase = customBaseMap.get(module.slug)
        if (customBase) {
          const merged: BaseModule = { ...module, ...customBase }
          combined.push({ source: 'custom', data: merged })
        } else {
          combined.push({ source: 'base', data: module })
        }
      }
      for (const module of customModules) {
        if (!systemModules.find(m => m.slug === module.slug)) {
          combined.push({ source: 'custom', data: module })
        }
      }
      setCombinedModules(combined)
      setComponentTypes(types)
      setModulesLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const loadModuleForEditing = async (module: CombinedModule) => {
    const data = module.data as BaseModule
    if (data.viewOptions?.length === 0) {
      data.viewOptions = [
        { label: 'Summary', slug: 'summary', description: 'Charts and KPIs overview', kind: 'summary' },
        { label: 'Table Grid', slug: 'table', description: 'Records as a table grid', kind: 'table' },
        { label: 'Archived', slug: 'archived', description: 'Archived records', kind: 'archived' },
      ]
    }
    setLoadingModule(true)
    try {
      setEditingCustomModuleSlug(null)
      if (module.source === 'custom') {
        setEditingCustomModuleSlug(data.slug)
      }
      setModuleSelected(true)
      setModuleSource(module.source)
      const data2: FormStateWithMeta = {
        id: data.id,
        label: data.label,
        slug: data.slug,
        color: data.color || 'blue',
        icon: data.icon || 'LayoutGrid',
        columns: data.columns ?? [],
        viewOptions: data.viewOptions ?? [],
        charts: [],
        _slugManuallyEdited: true,
      }
      setForm(data2)
      setStepIndex(1)
    } finally {
      setLoadingModule(false)
    }
  }

  const handleDeleteCustomModule = async (moduleSlug: string, moduleName: string) => {
    if (!confirmDelete(moduleName)) return
    const modules = await jsonConfig.getCustomModulesRaw()
    const target = modules.find(m => m.slug === moduleSlug)
    if (target) {
      target._deleted = true
      await jsonConfig.updateCustomModules(modules)
    }
    setCombinedModules(prev => prev.filter(m => m.source !== 'custom' || (m.data as BaseModule).slug !== moduleSlug))
  }

  const handleDeleteBaseModule = async (module: BaseModule, moduleName: string) => {
    if (!confirmDelete(moduleName)) return
    const modules = await jsonConfig.getSystemModulesRaw()
    const target = modules.find(m => m.slug === module.slug || m.id === module.id)
    if (target) {
      target._deleted = true
      await jsonConfig.updateSystemModules(modules)
    }
    setCombinedModules(prev => prev.filter(m => m.source !== 'base' || (m.data as BaseModule).slug !== module.slug))
  }

  const isNewModule = !editingCustomModuleSlug

  const generateSlugFromLabel = (label: string) => {
    if (!label) return ''
    return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/, '')
  }

  const updateField = (field: keyof FormState, value: string) => {
    setForm(prev => {
      if (field === 'label') {
        const manuallyEdited = (prev as FormStateWithMeta)._slugManuallyEdited
        if (!manuallyEdited) {
          return { ...prev, label: value, slug: generateSlugFromLabel(value) }
        }
        return { ...prev, label: value }
      }
      if (field === 'slug') {
        return { ...prev, slug: value, _slugManuallyEdited: true }
      }
      return { ...prev, [field]: value }
    })
  }

  const [showIconPicker, setShowIconPicker] = useState(false)

  const [colForm, setColForm] = useState<ColumnFormState>({
    key: '',
    header: '',
    type: 'TEXT',
    options: [],
    chartGroup: false,
  })

  const [showColForm, setShowColForm] = useState(false)
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null)

  const [viewForm, setViewForm] = useState<ViewFormState>({
    label: '',
    slug: '',
    description: '',
    kind: 'SUMMARY',
  })

  const [showViewForm, setShowViewForm] = useState(false)
  const [editingViewIndex, setEditingViewIndex] = useState<number | null>(null)

  useEffect(() => {
    setViewForm(prev => ({ ...prev, slug: prev.kind.toLowerCase() }))
  }, [viewForm.kind])

  const [chartForm, setChartForm] = useState<ChartFormState>({
    label: '',
    type: 'BAR',
    xAxisColumn: '',
    yAxisColumn: '',
    seriesColumn: '',
  })

  const [showChartForm, setShowChartForm] = useState(false)
  const [editingChartIndex, setEditingChartIndex] = useState<number | null>(null)

  const addChart = () => {
    if (!chartForm.label || !chartForm.xAxisColumn || !chartForm.yAxisColumn) return
    setForm(prev => ({
      ...prev,
      charts: [...prev.charts, { type: chartForm.type, label: chartForm.label, xAxis: chartForm.xAxisColumn, yAxis: chartForm.yAxisColumn, series: chartForm.seriesColumn || undefined }],
    }))
    setChartForm({ label: '', type: 'BAR', xAxisColumn: '', yAxisColumn: '', seriesColumn: '' })
    setShowChartForm(false)
    setEditingChartIndex(null)
  }

  const editChart = (index: number) => {
    setEditingChartIndex(index)
    const ch = form.charts[index]
    setChartForm({
      label: ch.label,
      type: ch.type,
      xAxisColumn: ch.xAxis,
      yAxisColumn: ch.yAxis,
      seriesColumn: ch.series || '',
    })
    setShowChartForm(true)
  }

  const saveEditedChart = () => {
    if (!chartForm.label || !chartForm.xAxisColumn || !chartForm.yAxisColumn || editingChartIndex === null) return
    setForm(prev => {
      const updated = [...prev.charts]
      updated[editingChartIndex] = { type: chartForm.type, label: chartForm.label, xAxis: chartForm.xAxisColumn, yAxis: chartForm.yAxisColumn, series: chartForm.seriesColumn || undefined }
      return { ...prev, charts: updated }
    })
    setChartForm({ label: '', type: 'BAR', xAxisColumn: '', yAxisColumn: '', seriesColumn: '' })
    setShowChartForm(false)
    setEditingChartIndex(null)
  }

  const removeChart = (index: number) => {
    const ch = form.charts[index]
    if (!confirmDelete(ch.label)) return
    setForm(prev => {
      const filtered = prev.charts.filter((_, i) => i !== index)
      return { ...prev, charts: filtered }
    })
    if (editingChartIndex !== null && editingChartIndex >= index) {
      const newIdx = editingChartIndex === index ? null : editingChartIndex - 1
      setEditingChartIndex(newIdx)
      setChartForm({ label: '', type: 'BAR', xAxisColumn: '', yAxisColumn: '', seriesColumn: '' })
      setShowChartForm(false)
    }
  }

  const addColumn = () => {
    if (!colForm.key || !colForm.header) return
    setForm(prev => ({
      ...prev,
      columns: [...prev.columns, { ...colForm, options: colForm.options.filter(Boolean) }],
    }))
    setColForm({ key: '', header: '', type: 'TEXT', options: [], chartGroup: false })
    setShowColForm(false)
    setEditingColumnIndex(null)
  }

  const editColumn = (index: number) => {
    setEditingColumnIndex(index)
    setColForm({
      ...form.columns[index],
      options: form.columns[index].options?.filter?.(Boolean) || [],
      chartGroup: form.columns[index].chartGroup ?? false,
    })
    setShowColForm(true)
  }

  const saveEditedColumn = () => {
    if (!colForm.key || !colForm.header || editingColumnIndex === null) return
    setForm(prev => {
      const updated = [...prev.columns]
      updated[editingColumnIndex] = { ...colForm, options: colForm.options.filter(Boolean) }
      return { ...prev, columns: updated }
    })
    setColForm({ key: '', header: '', type: 'TEXT', options: [], chartGroup: false })
    setShowColForm(false)
    setEditingColumnIndex(null)
  }

  const removeColumn = (index: number) => {
    const col = form.columns[index]
    if (!confirmDelete(col.header)) return
    setForm(prev => {
      const filtered = prev.columns.filter((_, i) => i !== index)
      return { ...prev, columns: filtered }
    })
    if (editingColumnIndex !== null && editingColumnIndex >= index) {
      const newIdx = editingColumnIndex === index ? null : editingColumnIndex - 1
      setEditingColumnIndex(newIdx)
      setColForm({ key: '', header: '', type: 'TEXT', options: [], chartGroup: false })
      setShowColForm(false)
    }
  }

  const addView = () => {
    if (!viewForm.label || !viewForm.slug) return
    setForm(prev => ({
      ...prev,
      viewOptions: [...prev.viewOptions, viewForm],
    }))
    setViewForm({ label: '', slug: '', description: '', kind: 'SUMMARY' })
    setShowViewForm(false)
    setEditingViewIndex(null)
  }

  const editView = (index: number) => {
    setEditingViewIndex(index)
    setViewForm({ ...form.viewOptions[index], description: form.viewOptions[index].description ?? '' })
    setShowViewForm(true)
  }

  const saveEditedView = () => {
    if (!viewForm.label || !viewForm.slug || editingViewIndex === null) return
    setForm(prev => {
      const updated = [...prev.viewOptions]
      updated[editingViewIndex] = viewForm
      return { ...prev, viewOptions: updated }
    })
    setViewForm({ label: '', slug: '', description: '', kind: 'SUMMARY' })
    setShowViewForm(false)
    setEditingViewIndex(null)
  }

  const removeView = (index: number) => {
    const vo = form.viewOptions[index]
    if (!confirmDelete(vo.label)) return
    setForm(prev => {
      const filtered = prev.viewOptions.filter((_, i) => i !== index)
      return { ...prev, viewOptions: filtered }
    })
    if (editingViewIndex !== null && editingViewIndex >= index) {
      const newIdx = editingViewIndex === index ? null : editingViewIndex - 1
      setEditingViewIndex(newIdx)
      setViewForm({ label: '', slug: '', description: '', kind: 'SUMMARY' })
      setShowViewForm(false)
    }
  }

  const canProceed = () => {
    if (currentStep === 'basic') {
      return form.label.trim() !== '' && form.slug.trim() !== ''
    }
    return stepIndex < STEPS.length - 1
  }

  const handleNext = () => {
    if (currentStep === 'basic' && !canProceed()) {
      setErrors({ label: t('createModule.errors.nameRequired'), slug: t('createModule.errors.slugRequired') })
      return
    }
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1)
    }
  }

  const handleBack = () => {
    if (stepIndex > 0) {
      if (stepIndex === 1 && !isNewModule) {
        setEditingCustomModuleSlug(null)
        setForm({
          label: '',
          slug: '',
          color: 'blue',
          icon: 'LayoutGrid',
          columns: [],
          viewOptions: [],
          charts: [],
          _slugManuallyEdited: false,
        })
      }
      setStepIndex(stepIndex - 1)
    } else {
      navigate('/app/settings')
    }
  }

  const handleSave = async () => {
    if (!form.id) return
    if (moduleSource === 'base') {
      const modules = await jsonConfig.getSystemModules()
      const index = modules.findIndex(m => m.id === form.id)
      if (index !== -1) {
        const updated = [...modules]
        updated[index] = {
          ...updated[index],
          label: form.label,
          slug: form.slug,
          color: form.color,
          icon: form.icon,
          viewOptions: form.viewOptions,
          columns: form.columns,
          summaryChart: form.charts.length > 0 ? { charts: form.charts } : undefined,
        }
        await jsonConfig.updateSystemModules(updated)
      }
    } else {
      const modules = await jsonConfig.getCustomModules()
      const index = modules.findIndex(m => m.id === form.id)
      if (index !== -1) {
        const updated = [...modules]
        updated[index] = {
          ...updated[index],
          label: form.label,
          slug: form.slug,
          color: form.color,
          icon: form.icon,
          viewOptions: form.viewOptions,
          columns: form.columns,
          summaryChart: form.charts.length > 0 ? { charts: form.charts } : undefined,
        }
        await jsonConfig.updateCustomModules(updated)
      } else {
        const newModule: BaseModule = {
          id: form.id,
          label: form.label,
          slug: form.slug,
          color: form.color,
          icon: form.icon,
          source: 'custom',
          viewOptions: form.viewOptions,
          columns: form.columns,
          summaryChart: form.charts.length > 0 ? { charts: form.charts } : undefined,
        }
        const updated = [...modules, newModule]
        await jsonConfig.updateCustomModules(updated)
      }
    }
    showReloadNotification()
  }

  const iconOptions = componentTypes.icons.length > 0 ? componentTypes.icons.slice(0, 30) : []

  const getIconComponent = (name: string) => {
    const pascal = name.charAt(0).toUpperCase() + name.slice(1)
    const Icon = (LucideIcons as Record<string, any>)[pascal]
    return Icon || Plus
  }

  const renderStep = () => {
    if (currentStep === 'modules') {
      return (
        <div className="space-y-6">
          <p className="text-sm text-[var(--text-secondary)]">{STEPS[stepIndex].description}</p>
          {moduleSelected && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-2.5">
              <svg className="w-4 h-4 text-[var(--accent)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19.5 3 16.5 16.5 3.5z"/></svg>
              <span className="text-sm font-medium text-[var(--accent)]">editing module: <span className="font-semibold">{form.label}</span></span>
            </div>
          )}
          {!modulesLoaded ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
          ) : combinedModules?.length === 0 ? (
            <div className="text-center py-12">
              <Table2 className="w-12 h-12 mx-auto text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)] mt-4">No modules available</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Click "Next" to create your first module</p>
            </div>
          ) : (
            <div className="space-y-4">
              {combinedModules?.length > 0 && (
                <>
                  <div className="overflow-auto rounded-lg border border-[var(--border)]">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--bg-surface)]">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-medium text-[var(--text-muted)]">Source</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-[var(--text-muted)]">Name</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-[var(--text-muted)]">Slug</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-[var(--text-muted)]">Icon</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-[var(--text-muted)]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {combinedModules?.map(m => (
                          <tr
                            key={`${m.source}-${(m.data as BaseModule).slug}`}
                            className="border-t border-[var(--border)] cursor-pointer hover:bg-[var(--bg-surface-hover)] transition"
                            onClick={() => loadModuleForEditing(m)}
                          >
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded ${m.source === 'base' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                                {m.source}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{(m.data as BaseModule).label}</td>
                            <td className="px-4 py-3 text-[var(--text-muted)]">{(m.data as BaseModule).slug}</td>
                            <td className="px-4 py-3 text-[var(--text-muted)]">{(m.data as BaseModule).icon || '—'}</td>
                            <td className="px-4 py-3 text-right">
                              {m.source === 'custom' ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteCustomModule((m.data as BaseModule).slug, (m.data as BaseModule).label)
                                  }}
                                  className="text-[var(--text-muted)] hover:text-red-500 transition"
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              ) : devMode ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteBaseModule(m.data as BaseModule, (m.data as BaseModule).label)
                                  }}
                                  className="text-[var(--text-muted)] hover:text-red-500 transition"
                                  title={`Delete ${(m.data as BaseModule).label}`}
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    loadModuleForEditing(m)
                                  }}
                                  className="text-[var(--text-muted)] hover:text-[var(--accent)] transition"
                                >
                                  <Plus className="w-4 h-4 inline" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {devMode
                      ? 'Developer mode is on: you can delete base modules by clicking the delete icon.'
                      : 'Base modules are read-only templates. Click to use as a starting point, or go to the next step to create a new module.'}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )
    }
    if (currentStep === 'basic') {
      return (
        <div className="space-y-6">
          <p className="text-sm text-[var(--text-secondary)]">{STEPS[stepIndex].description}</p>
          {moduleSelected && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-2.5">
              <svg className="w-4 h-4 text-[var(--accent)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19.5 3 16.5 16.5 3.5z"/></svg>
              <span className="text-sm font-medium text-[var(--accent)]">editing module: <span className="font-semibold">{form.label}</span></span>
            </div>
          )}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">{t('createModule.moduleName')}</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              value={form.label}
              onChange={e => updateField('label', e.target.value)}
              placeholder={t('createModule.moduleNamePlaceholder')}
            />
            {errors.label && <p className="text-xs text-red-500 mt-1">{errors.label}</p>}
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">{t('createModule.urlSlug')}</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              value={form.slug}
              onChange={e => updateField('slug', e.target.value)}
              placeholder="module-slug"
            />
            {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
            {form.label && !((form as FormStateWithMeta)._slugManuallyEdited) && (
              <p className="text-xs text-[var(--text-muted)] mt-1">{t('createModule.urlSlug')} auto: {generateSlugFromLabel(form.label)}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">{t('createModule.color')}</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="w-10 h-10 rounded cursor-pointer border border-[var(--border)]"
                  value={form.color}
                  onChange={e => updateField('color', e.target.value)}
                />
                <input
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  value={form.color}
                  onChange={e => updateField('color', e.target.value)}
                  placeholder="#f2a93b"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">{t('createModule.icon')}</label>
              <button
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm flex items-center gap-2 hover:bg-[var(--bg-surface-hover)] transition"
                onClick={() => setShowIconPicker(!showIconPicker)}
              >
                {form.icon ? (() => {
                  const IconComp = getIconComponent(form.icon)
                  return IconComp ? <IconComp className="w-5 h-5" /> : <Plus className="w-5 h-5" />
                })() : (
                  <Plus className="w-5 h-5" />
                )}
                <span className="flex-1 text-left">{form.label || 'Select icon'}</span>
                <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${showIconPicker ? 'rotate-90' : ''}`} />
              </button>
              <Expandable open={showIconPicker}>
                <div className="grid grid-cols-6 gap-2 mt-2 p-2 rounded-lg border border-[var(--border)]">
                  {iconOptions.map(ic => {
                    const IconComp = getIconComponent(ic.value)
                    return (
                      <button
                        key={ic.value}
                        onClick={() => updateField('icon', ic.value)}
                        className={`w-8 h-8 flex items-center justify-center rounded border transition ${
                          form.icon === ic.value ? 'border-[var(--accent)] bg-[var(--accent)]/20' : 'border-[var(--border)] hover:bg-[var(--bg-surface-hover)]'
                        }`}
                        title={ic.label}
                      >
                        {IconComp ? <IconComp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    )
                  })}
                </div>
              </Expandable>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {moduleSource !== null && devMode && (
              <>
                <button
                  onClick={() => {
                    setModuleSource(null)
                    setStepIndex(0)
                  }}
                  className="px-8 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-white text-base hover:bg-[var(--bg-surface-hover)] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (form.label.trim() && form.slug.trim()) {
                      handleSave()
                    }
                  }}
                  className="px-8 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-white text-base hover:bg-[var(--bg-surface-hover)] transition"
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      )
    }

    if (currentStep === 'columns') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">{STEPS[stepIndex].description}</p>
          {moduleSelected && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-2.5">
              <svg className="w-4 h-4 text-[var(--accent)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19.5 3 16.5 16.5 3.5z"/></svg>
              <span className="text-sm font-medium text-[var(--accent)]">editing module: <span className="font-semibold">{form.label}</span></span>
            </div>
          )}
          {form.columns?.map((col, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]">
              <div className="flex-1">
                <span className="text-sm text-[var(--text-primary)]">{col.header}</span>
                <span className="text-xs text-[var(--text-muted)] ml-2">({col.type})</span>
                {col.chartGroup && <span className="text-xs text-[var(--accent)] ml-1">chart</span>}
              </div>
              <button onClick={() => editColumn(i)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => removeColumn(i)} className="text-[var(--text-muted)] hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {form.columns?.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">{t('createModule.noColumns')}</p>
          )}

          <button
            onClick={() => setShowColForm(!showColForm)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-sm flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
          >
            <Plus className="w-4 h-4" />
            <span className="flex-1 text-left">Add column</span>
            <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${showColForm ? 'rotate-90' : ''}`} />
          </button>
          <Expandable open={showColForm}>
            <div className="space-y-3 pt-2 border-t border-[var(--border)]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">{t('createModule.columnKey')}</label>
                  <input
                    className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    value={colForm.key}
                    onChange={e => setColForm(prev => ({ ...prev, key: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">{t('createModule.columnHeader')}</label>
                  <input
                    className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    value={colForm.header}
                    onChange={e => setColForm(prev => ({ ...prev, header: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">{t('createModule.columns')}</label>
                  <select
                    className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    value={colForm.type}
                    onChange={e => setColForm(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {COLUMN_TYPES.map(ct => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={colForm.chartGroup}
                      onChange={e => setColForm(prev => ({ ...prev, chartGroup: e.target.checked }))}
                    />
                    Chart group
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={editingColumnIndex !== null ? saveEditedColumn : addColumn}
                  disabled={!colForm.key || !colForm.header}
                  className="px-3 py-1.5 rounded bg-[var(--accent)] text-white text-sm disabled:opacity-50"
                >
                  {editingColumnIndex !== null ? 'Save edited column' : t('createModule.addColumn')}
                </button>
                {editingColumnIndex !== null && (
                  <button
                    onClick={() => {
                      setEditingColumnIndex(null)
                      setColForm({ key: '', header: '', type: 'TEXT', options: [], chartGroup: false })
                      setShowColForm(false)
                    }}
                    className="px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-surface-hover)] transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </Expandable>
          <div className="flex justify-end gap-2">
            {moduleSource !== null && devMode && (
              <>
                <button
                  onClick={() => {
                    setModuleSource(null)
                    setStepIndex(0)
                  }}
                  className="px-8 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-white text-base hover:bg-[var(--bg-surface-hover)] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (form.label.trim() && form.slug.trim()) {
                      handleSave()
                    }
                  }}
                  className="px-8 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-white text-base hover:bg-[var(--bg-surface-hover)] transition"
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      )
    }

    if (currentStep === 'views') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">{STEPS[stepIndex].description}</p>
          {moduleSelected && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-2.5">
              <svg className="w-4 h-4 text-[var(--accent)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19.5 3 16.5 16.5 3.5z"/></svg>
              <span className="text-sm font-medium text-[var(--accent)]">editing module: <span className="font-semibold">{form.label}</span></span>
            </div>
          )}
          {form.viewOptions?.map((vo, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]">
              <div className="flex-1">
                <span className="text-sm text-[var(--text-primary)]">{vo.label}</span>
                <span className="text-xs text-[var(--text-muted)] ml-2">({vo.kind})</span>
              </div>
              <button onClick={() => editView(i)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => removeView(i)} className="text-[var(--text-muted)] hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {form.viewOptions?.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">{t('createModule.noViews')}</p>
          )}

          <button
            onClick={() => setShowViewForm(!showViewForm)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-sm flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
          >
            <Plus className="w-4 h-4" />
            <span className="flex-1 text-left">Add view</span>
            <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${showViewForm ? 'rotate-90' : ''}`} />
          </button>
          <Expandable open={showViewForm}>
            <div className="space-y-3 pt-2 border-t border-[var(--border)]">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">{t('createModule.viewLabel')}</label>
                <input
                  className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  value={viewForm.label}
                  onChange={e => setViewForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="View name"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Description</label>
                <input
                  className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  value={viewForm.description}
                  onChange={e => setViewForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="View description"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Kind</label>
                <select
                  className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  value={viewForm.kind}
                  onChange={e => setViewForm(prev => ({ ...prev, kind: e.target.value }))}
                >
                  {VIEW_KINDS.map(vk => (
                    <option key={vk.value} value={vk.value}>{vk.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={editingViewIndex !== null ? saveEditedView : addView}
                  disabled={!viewForm.label || !viewForm.slug}
                  className="px-3 py-1.5 rounded bg-[var(--accent)] text-white text-sm disabled:opacity-50"
                >
                  {editingViewIndex !== null ? 'Save edited view' : t('createModule.addView')}
                </button>
                {editingViewIndex !== null && (
                  <button
                    onClick={() => {
                      setEditingViewIndex(null)
                      setViewForm({ label: '', slug: '', description: '', kind: 'SUMMARY' })
                      setShowViewForm(false)
                    }}
                    className="px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-surface-hover)] transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </Expandable>
          <div className="flex justify-end gap-2">
            {moduleSource !== null && devMode && (
              <>
                <button
                  onClick={() => {
                    setModuleSource(null)
                    setStepIndex(0)
                  }}
                  className="px-8 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-white text-base hover:bg-[var(--bg-surface-hover)] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (form.label.trim() && form.slug.trim()) {
                      handleSave()
                    }
                  }}
                  className="px-8 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-white text-base hover:bg-[var(--bg-surface-hover)] transition"
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">{STEPS[stepIndex].description}</p>
          {moduleSelected && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-2.5">
              <svg className="w-4 h-4 text-[var(--accent)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19.5 3 16.5 16.5 3.5z"/></svg>
              <span className="text-sm font-medium text-[var(--accent)]">editing module: <span className="font-semibold">{form.label}</span></span>
            </div>
          )}
        {form.charts?.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">No charts configured yet</p>
        )}

        {form.charts?.map((ch, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]">
            <div className="flex-1">
              <span className="text-sm text-[var(--text-primary)]">{ch.label}</span>
              <span className="text-xs text-[var(--text-muted)] ml-2">({ch.type})</span>
              <span className="text-xs text-[var(--text-muted)] ml-2">{ch.xAxis} vs {ch.yAxis}</span>
            </div>
            <button onClick={() => editChart(i)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => removeChart(i)} className="text-[var(--text-muted)] hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button
          onClick={() => setShowChartForm(!showChartForm)}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-sm flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
        >
          <Plus className="w-4 h-4" />
          <span className="flex-1 text-left">Add chart</span>
          <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${showChartForm ? 'rotate-90' : ''}`} />
        </button>
        <Expandable open={showChartForm}>
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Chart name</label>
              <input
                className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={chartForm.label}
                onChange={e => setChartForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Sales chart"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Chart type</label>
                <select
                  className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  value={chartForm.type}
                  onChange={e => setChartForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  {CHART_TYPES.map(ct => (
                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Series column (optional)</label>
                <input
                  className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  value={chartForm.seriesColumn}
                  onChange={e => setChartForm(prev => ({ ...prev, seriesColumn: e.target.value }))}
                  placeholder="Category"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">X Axis column</label>
              <input
                className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={chartForm.xAxisColumn}
                onChange={e => setChartForm(prev => ({ ...prev, xAxisColumn: e.target.value }))}
                placeholder="e.g. Date, Month, Category"
              />
              {form.columns?.length > 0 && (
                <p className="text-xs text-[var(--text-muted)] mt-1">Leave empty if creating charts only</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Y Axis column</label>
              <input
                className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={chartForm.yAxisColumn}
                onChange={e => setChartForm(prev => ({ ...prev, yAxisColumn: e.target.value }))}
                placeholder="e.g. Amount, Count, Value"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={editingChartIndex !== null ? saveEditedChart : addChart}
                disabled={!chartForm.label || !chartForm.xAxisColumn || !chartForm.yAxisColumn}
                className="px-3 py-1.5 rounded bg-[var(--accent)] text-white text-sm disabled:opacity-50"
              >
                {editingChartIndex !== null ? 'Save edited chart' : 'Add chart'}
              </button>
              {editingChartIndex !== null && (
                <button
                  onClick={() => {
                    setEditingChartIndex(null)
                    setChartForm({ label: '', type: 'BAR', xAxisColumn: '', yAxisColumn: '', seriesColumn: '' })
                    setShowChartForm(false)
                  }}
                  className="px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-surface-hover)] transition"
                >
                  Cancel
                </button>
              )}
              </div>
            </div>
          </Expandable>
          <div className="flex justify-end gap-2">
            {moduleSource !== null && devMode && (
              <>
                <button
                  onClick={() => {
                    setModuleSource(null)
                    setStepIndex(0)
                  }}
                  className="px-8 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-white text-base hover:bg-[var(--bg-surface-hover)] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (form.label.trim() && form.slug.trim()) {
                      handleSave()
                    }
                  }}
                  className="px-8 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-white text-base hover:bg-[var(--bg-surface-hover)] transition"
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      )
    }

    return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-4">
        <button
          onClick={handleBack}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-medium text-[var(--text-primary)]">{t('createModule.moduleName')}</h2>
          <p className="text-xs text-[var(--text-muted)]">{currentStepLabel}</p>
        </div>
      </div>

      {/* Steps */}
      <div className="px-6 py-3 border-b border-[var(--border)] flex gap-1 text-xs">
        {STEPS.filter(s => s.step !== 'modules' || isNewModule).map((s) => {
          const actualIndex = STEPS.findIndex(st => st.step === s.step)
          return (
            <button
              key={s.step}
              onClick={() => setStepIndex(actualIndex)}
              className={`px-3 py-1 rounded transition ${
                actualIndex === stepIndex
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t(s.label)}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {errors._general && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
            {errors._general}
          </div>
        )}
        {renderStep()}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between">
        <button
          onClick={handleBack}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
        >
          {stepIndex === 0 ? t('common.cancel') : t('common.back')}
        </button>
        <div className="flex gap-2">
          {stepIndex === 0 && combinedModules?.length > 0 ? (
            <button
              onClick={() => { setModuleSelected(true); setModuleSource(null); setEditingCustomModuleSlug(null); setForm({ label: '', slug: '', color: 'blue', icon: 'LayoutGrid', columns: [], viewOptions: [], charts: [], _slugManuallyEdited: true }); setStepIndex(1) }}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm"
            >
              Create new module
            </button>
          ) : stepIndex === 0 && combinedModules?.length === 0 ? (
            <button
              onClick={() => setStepIndex(1)}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm"
            >
              {t('common.next')}
            </button>
          ) : stepIndex < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm disabled:opacity-50"
            >
              {t('common.next')}
            </button>
          ) : moduleSource === null && devMode && (
            
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm"
            >
              Save And Create New Module
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
