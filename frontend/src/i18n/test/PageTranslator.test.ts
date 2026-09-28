// ──────────────────────────────────────────────
// PageTranslator: traduce lo que hay en pantalla,
// sigue los cambios de React y restaura al volver
// al español.
// ──────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { setPageLanguage } from '@i18n/PageTranslator'

/** Servicio falso: antepone "EN:". */
function mockService() {
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { q: string[] }
    return new Response(JSON.stringify({ translatedText: body.q.map(t => `EN:${t}`), complete: true }))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// La caché del traductor vive toda la sesión: cada test usa textos propios.
let n = 0
const uid = (text: string) => `${text} ${++n}`

describe('PageTranslator', () => {
  beforeEach(() => {
    mockService()
  })

  afterEach(() => {
    setPageLanguage('es')
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('traduce texto y placeholder, conservando los espacios', async () => {
    const button = uid('Empezar curso')
    const placeholder = uid('Buscar video')
    document.body.innerHTML = `<button> ${button} </button><input placeholder="${placeholder}" value="${button}">`

    setPageLanguage('en')

    await waitFor(() => expect(document.querySelector('button')!.textContent).toBe(` EN:${button} `))
    expect(document.querySelector('input')!.getAttribute('placeholder')).toBe(`EN:${placeholder}`)
    // El valor de un campo es del usuario: no se toca.
    expect(document.querySelector('input')!.value).toBe(button)
  })

  it('respeta translate="no", código y notación de cartas', async () => {
    const name = uid('María García')
    const label = uid('Abrir la clase')
    document.body.innerHTML = `<p translate="no">${name}</p><code>${uid('pagar')}</code><span>As Kh</span><b>${label}</b>`

    setPageLanguage('en')

    await waitFor(() => expect(document.querySelector('b')!.textContent).toBe(`EN:${label}`))
    expect(document.querySelector('p')!.textContent).toBe(name)
    expect(document.querySelector('code')!.textContent).not.toMatch(/^EN:/)
    expect(document.querySelector('span')!.textContent).toBe('As Kh')
  })

  it('traduce lo que se añade o cambia después (como hace React)', async () => {
    document.body.innerHTML = '<div id="root"></div>'
    setPageLanguage('en')

    const added = uid('Primeros pasos')
    const p = document.createElement('p')
    p.textContent = added
    document.getElementById('root')!.appendChild(p)
    await waitFor(() => expect(p.textContent).toBe(`EN:${added}`))

    const changed = uid('Siguiente clase')
    p.firstChild!.nodeValue = changed
    await waitFor(() => expect(p.textContent).toBe(`EN:${changed}`))
  })

  it('al volver al español restaura los originales', async () => {
    const text = uid('Tu progreso')
    document.body.innerHTML = `<h1>${text}</h1>`

    setPageLanguage('en')
    await waitFor(() => expect(document.querySelector('h1')!.textContent).toBe(`EN:${text}`))

    setPageLanguage('es')
    expect(document.querySelector('h1')!.textContent).toBe(text)
    expect(document.documentElement.lang).toBe('es')
  })

  it('sin servicio deja el español y no reintenta en bucle', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    vi.stubGlobal('fetch', fetchMock)
    const text = uid('Reto del día')
    document.body.innerHTML = `<p>${text}</p>`

    setPageLanguage('en')
    await new Promise(resolve => setTimeout(resolve, 200))

    expect(document.querySelector('p')!.textContent).toBe(text)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('no pierde un texto que llega en un segundo lote mientras el primero sigue en vuelo', async () => {
    const first = uid('Preguntas')
    const second = uid('Reintentar')
    // El lote con `second` tarda más que el de `first`.
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { q: string[] }
      await new Promise(resolve => setTimeout(resolve, body.q.includes(second) ? 150 : 50))
      return new Response(JSON.stringify({ translatedText: body.q.map(t => `EN:${t}`), complete: true }))
    }))
    document.body.innerHTML = `<h1>${first}</h1><div id="banner"></div>`
    setPageLanguage('en')

    // Llega mientras el primer lote está en vuelo.
    await new Promise(resolve => setTimeout(resolve, 45))
    const button = document.createElement('button')
    button.textContent = second
    document.getElementById('banner')!.appendChild(button)

    await waitFor(() => expect(document.querySelector('h1')!.textContent).toBe(`EN:${first}`))
    await waitFor(() => expect(button.textContent).toBe(`EN:${second}`))
  })
})
