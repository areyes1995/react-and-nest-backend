import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateModule } from '@services/module-validator'
import { jsonConfig } from '@services/json-config'

vi.mock('@services/json-config', () => ({
  jsonConfig: { getSettingsSchema: vi.fn() },
}))

const schemaMock = vi.mocked(jsonConfig.getSettingsSchema)

describe('validateModule', () => {
  beforeEach(() => vi.clearAllMocks())

  const schema = {
    module: {
      label: { required: true, minLength: 3, maxLength: 10 },
      slug: { required: true, pattern: '^[a-z0-9-]+$', message: 'slug inválido' },
      color: { allowedValues: ['red', 'blue'] },
      count: { min: 1, max: 5 },
      viewOptions: { required: true, itemSchema: { label: { required: true } } },
      columns: { required: false, itemSchema: { key: { required: true } } },
    },
  }

  it('válido → valid true', async () => {
    schemaMock.mockResolvedValue(schema as any)
    const out = await validateModule({
      label: 'Ventas',
      slug: 'ventas-1',
      color: 'red',
      count: 3,
      viewOptions: [{ label: 'Tabla' }],
      columns: [{ key: 'a' }],
    })
    expect(out).toEqual({ valid: true, errors: [] })
  })

  it('sin schema → error de schema', async () => {
    schemaMock.mockResolvedValue({} as any)
    const out = await validateModule({})
    expect(out.valid).toBe(false)
    expect(out.errors[0].field).toBe('schema')
  })

  it('required, min/maxLength, pattern, allowedValues, min/max', async () => {
    schemaMock.mockResolvedValue(schema as any)
    const out = await validateModule({
      label: 'AB',
      slug: 'MAL_SLUG',
      color: 'green',
      count: 9,
      viewOptions: [],
      columns: [],
    })
    expect(out.valid).toBe(false)
    const fields = out.errors.map(e => e.field)
    expect(fields).toContain('label')
    expect(fields).toContain('slug')
    expect(fields).toContain('color')
    expect(fields).toContain('count')
    expect(fields).toContain('viewOptions')
    expect(out.errors.find(e => e.field === 'slug')?.message).toBe('slug inválido')
  })

  it('items anidados reportan índice', async () => {
    schemaMock.mockResolvedValue(schema as any)
    const out = await validateModule({
      label: 'Ventas',
      slug: 'ventas',
      color: 'red',
      count: 2,
      viewOptions: [{}, { label: 'ok' }],
      columns: [{ key: 'a' }],
    })
    expect(out.valid).toBe(false)
    expect(out.errors.some(e => e.field === 'viewOptions[0].label')).toBe(true)
  })
})
