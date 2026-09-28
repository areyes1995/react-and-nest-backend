// ──────────────────────────────────────────────
// El enlazador marca los términos del glosario una
// sola vez y sin confundirlos con palabras comunes.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { linkGlossaryTerms, type GlossarySegment } from '@features/glossary/linker'

const linked = (segments: GlossarySegment[]) =>
  segments.flatMap(segment => (typeof segment === 'string' ? [] : [segment.term.term]))

describe('linkGlossaryTerms', () => {
  it('enlaza términos sin importar mayúsculas y conserva el texto', () => {
    const segments = linkGlossaryTerms('En el flop haces c-bet.', new Set())
    expect(linked(segments)).toEqual(['Flop', 'C-bet'])
    expect(segments.map(s => (typeof s === 'string' ? s : s.text)).join('')).toBe('En el flop haces c-bet.')
  })

  it('solo enlaza la primera aparición, también entre textos', () => {
    const seen = new Set<string>()
    expect(linked(linkGlossaryTerms('Flop y otro flop', seen))).toEqual(['Flop'])
    expect(linked(linkGlossaryTerms('El flop de nuevo', seen))).toEqual([])
  })

  it('prefiere el término más largo', () => {
    expect(linked(linkGlossaryTerms('Un check-raise en el turn', new Set()))).toEqual(['Check-raise', 'Turn'])
  })

  it('acepta el plural en "s" y las traducciones claras', () => {
    expect(linked(linkGlossaryTerms('Piensa en rangos, no en faroles', new Set()))).toEqual(['Rango'])
    expect(linked(linkGlossaryTerms('Un farol bien hecho', new Set()))).toEqual(['Bluff'])
  })

  it('no confunde palabras corrientes del español', () => {
    expect(linked(linkGlossaryTerms('Ante todo, las calles del bote', new Set()))).toEqual([])
    expect(linked(linkGlossaryTerms('Pon un tag en la etiqueta', new Set()))).toEqual([])
    expect(linked(linkGlossaryTerms('Juega como un TAG', new Set()))).toEqual(['TAG'])
  })
})
