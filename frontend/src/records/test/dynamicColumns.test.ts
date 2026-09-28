import { describe, it, expect } from 'vitest'
import { humanizeKey, buildDynamicTable } from '@records/dynamicColumns'

describe('humanizeKey', () => {
  it.each([
    ['firstName', 'First Name'],
    ['visitor_email', 'Visitor Email'],
    ['stand-number', 'Stand Number'],
    ['createdAt', 'Created At'],
    ['URLValue', 'URL Value'],
    ['a', 'A'],
  ])('%s → %s', (input, expected) => {
    expect(humanizeKey(input)).toBe(expected)
  })
})

describe('buildDynamicTable', () => {
  it('deriva columnas en orden de aparición con headers humanizados', () => {
    const { columns, data } = buildDynamicTable([
      { firstName: 'Ana', age: 30 },
      { firstName: 'Bob', city: 'SD' },
    ])
    expect(columns.map(c => c.key)).toEqual(['firstName', 'age', 'city'])
    expect(columns[0].header).toBe('First Name')
    expect(data).toHaveLength(2)
    expect(data[0].status).toBe('Active')
  })

  it('infiere tipos number/select/text', () => {
    const { columns } = buildDynamicTable([{ n: 1, b: true, s: 'x' }])
    expect(columns.find(c => c.key === 'n')?.type).toBe('number')
    expect(columns.find(c => c.key === 'b')?.type).toBe('select')
    expect(columns.find(c => c.key === 's')?.type).toBe('text')
  })

  it('hidden excluye la columna', () => {
    const { columns } = buildDynamicTable([{ a: 1, b: 2 }], {
      columns: { b: { hidden: true } },
    })
    expect(columns.map(c => c.key)).toEqual(['a'])
  })

  it('transform aplica conversión y select genera options', () => {
    const { columns, data } = buildDynamicTable(
      [{ active: true }, { active: false }],
      { columns: { active: { transform: v => (v ? 'sí' : 'no') } } },
    )
    expect(data[0].active).toBe('sí')
    expect(columns[0].options).toEqual(expect.arrayContaining(['sí', 'no']))
  })

  it('type list usa itemsOf', () => {
    const { data, columns } = buildDynamicTable(
      [{ tags: [{ label: 'a' }, { label: 'b' }] }],
      {
        columns: {
          tags: { type: 'list', itemsOf: (item: any) => item.label },
        },
      },
    )
    expect(data[0].tags).toEqual(['a', 'b'])
    expect(columns[0].options).toEqual(['a', 'b'])
  })

  it('idOf/statusOf personalizan filas y omite id/status del set', () => {
    const { data } = buildDynamicTable([{ id: 99, status: 'x', v: 1 }], {
      idOf: (_r, i) => `row-${i}`,
      statusOf: () => 'Archived' as any,
    })
    expect(data[0].id).toBe('row-0')
    expect(data[0].status).toBe('Archived')
    expect('status' in data[0] && data[0].v).toBe(1)
  })

  it('filas vacías → columnas y datos vacíos', () => {
    expect(buildDynamicTable([])).toEqual({ columns: [], data: [] })
  })

  it('boolean/null se convierten a celda', () => {
    const { data } = buildDynamicTable([{ b: false, n: null, u: undefined } as any])
    expect(data[0].b).toBe('false')
    expect(data[0].n).toBe('')
  })
})
