// ──────────────────────────────────────────────
// Cliente del worker de equity.
// Solo importa el último cálculo: si llega uno
// nuevo con otro en marcha, el worker viejo se
// termina y se arranca otro, así los clics seguidos
// no se encolan ni devuelven números de otra mano.
// Sin soporte de workers, calcula en el hilo.
// ──────────────────────────────────────────────

import { equityMultiway, type Card, type EquityResult } from '@poker/engine'
import type { EquityRequest } from './equity.worker'

interface Pending {
  id: number
  resolve: (results: EquityResult[]) => void
  reject: (error: Error) => void
}

/** Se rechaza con este error cuando un cálculo más nuevo lo sustituye. */
export class EquityCancelled extends Error {
  constructor() {
    super('Cálculo sustituido por otro más reciente')
  }
}

let worker: Worker | null = null
let pending: Pending | null = null
let nextId = 0

function spawn(): Worker {
  const created = new Worker(new URL('./equity.worker.ts', import.meta.url), { type: 'module' })
  created.addEventListener('message', (event: MessageEvent<{ id: number; results?: EquityResult[]; error?: string }>) => {
    const current = pending
    if (!current || current.id !== event.data.id) return
    pending = null
    if (event.data.results) current.resolve(event.data.results)
    else current.reject(new Error(event.data.error ?? 'Error en el cálculo'))
  })
  created.addEventListener('error', () => {
    pending?.reject(new Error('El cálculo falló'))
    pending = null
    worker?.terminate()
    worker = null
  })
  return created
}

export function computeEquity(hands: Card[][], board: Card[], samples: number): Promise<EquityResult[]> {
  if (typeof Worker === 'undefined') {
    return new Promise(resolve => resolve(equityMultiway(hands, board, { samples })))
  }

  // Hay uno en marcha: ya no sirve. Se corta en seco en lugar de esperarlo.
  if (pending) {
    pending.reject(new EquityCancelled())
    pending = null
    worker?.terminate()
    worker = null
  }

  worker ??= spawn()
  const id = ++nextId
  return new Promise((resolve, reject) => {
    pending = { id, resolve, reject }
    const request: EquityRequest = { id, hands, board, samples }
    worker!.postMessage(request)
  })
}
