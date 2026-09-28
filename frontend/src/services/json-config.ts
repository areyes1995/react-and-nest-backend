import { emitConfigUpdate } from './config-events'

export interface ColumnType {
  key: string
  header: string
  type: string
  options?: string[]
  chartGroup?: boolean
}

export interface ViewOption {
  label: string
  slug: string
  description?: string
  kind: string
}

export interface BaseModule {
  id?: string
  label: string
  slug: string
  color: string
  icon: string
  viewOptions: ViewOption[]
  columns: ColumnType[]
  summaryChart?: Record<string, any>
  source?: 'base' | 'custom'
  _deleted?: boolean
}

export interface ComponentTypesConfig {
  columnTypes: string[]
  viewKinds: string[]
  colors: { value: string; label: string }[]
  icons: { value: string; label: string }[]
  chartTypes: { value: string; label: string }[]
  defaults: {
    color: string
    icon: string
    viewKind: string
  }
}

export interface SettingsSchema {
  version: string
  description: string
  module: {
    label: { type: string; required: boolean; minLength: number; maxLength: number; pattern: string; message: string }
    slug: { type: string; required: boolean; minLength: number; maxLength: number; pattern: string; message: string }
    color: { type: string; required: boolean; allowedValues: string[]; defaultValue: string; message: string }
    icon: { type: string; required: boolean; defaultValue: string; message: string }
    viewOptions: { type: string; required: boolean; minItems: number; maxItems: number; itemSchema: Record<string, unknown> }
    columns: { type: string; required: boolean; itemSchema: Record<string, unknown> }
  }
}

let _componentTypes: ComponentTypesConfig | null = null
let _systemModules: BaseModule[] | null = null
let _systemModulesRaw: BaseModule[] | null = null
let _customModules: BaseModule[] | null = null
let _customModulesRaw: BaseModule[] | null = null
let _schema: SettingsSchema | null = null

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`)
  return res.json() as T
}

async function loadComponentTypes(): Promise<ComponentTypesConfig> {
  if (!_componentTypes) {
    _componentTypes = await fetchJson<ComponentTypesConfig>('/local-config/component-types.json')
  }
  return _componentTypes
}

async function loadSystemModules(): Promise<BaseModule[]> {
  if (!_systemModules) {
    _systemModulesRaw = await fetchJson<BaseModule[]>('/local-config/system-modules.json')
    _systemModules = _systemModulesRaw.filter(m => !m._deleted) as unknown as BaseModule[]
  }
  return _systemModules
}

async function loadCustomModules(): Promise<BaseModule[]> {
  if (!_customModules) {
    _customModulesRaw = await fetchJson<BaseModule[]>('/local-config/custom-modules.json')
    _customModules = _customModulesRaw.filter(m => !m._deleted) as unknown as BaseModule[]
  }
  return _customModules
}

async function loadSettingsSchema(): Promise<SettingsSchema> {
  if (!_schema) {
    _schema = await fetchJson<SettingsSchema>('/local-config/settings-schema.json')
  }
  return _schema
}

export const jsonConfig = {
  getComponentTypes: async (): Promise<ComponentTypesConfig> => loadComponentTypes(),
  getSystemModules: async (): Promise<BaseModule[]> => loadSystemModules(),
  getCustomModules: async (): Promise<BaseModule[]> => loadCustomModules(),
  getSettingsSchema: async (): Promise<SettingsSchema> => loadSettingsSchema(),

  getSystemModulesRaw: async (): Promise<BaseModule[]> => {
    if (_systemModulesRaw === null) await loadSystemModules()
    return (_systemModulesRaw ?? []) as unknown as BaseModule[]
  },

  getCustomModulesRaw: async (): Promise<BaseModule[]> => {
    if (_customModulesRaw === null) await loadCustomModules()
    return (_customModulesRaw ?? []) as unknown as BaseModule[]
  },

  async updateSystemModules(modules: BaseModule[]): Promise<void> {
    const res = await fetch('/local-config/system-modules.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modules),
    })
    if (!res.ok) throw new Error('Failed to update system-modules.json')
    _systemModulesRaw = modules
    _systemModules = modules.filter(m => !m._deleted)
    emitConfigUpdate()
  },

  async updateCustomModules(modules: BaseModule[]): Promise<void> {
    const res = await fetch('/local-config/custom-modules.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modules),
    })
    if (!res.ok) throw new Error('Failed to update custom-modules.json')
    _customModulesRaw = modules
    _customModules = modules.filter(m => !m._deleted)
    emitConfigUpdate()
  },
}
