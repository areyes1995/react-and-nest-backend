// ──────────────────────────────────────────────
// Worker de equity — el Monte Carlo fuera del hilo
// principal, para que la página no se congele
// mientras se calcula una mesa llena.
// ──────────────────────────────────────────────

import { equityMultiway, type Card } from '@poker/engine'

export interface EquityRequest {
  id: number
  hands: Card[][]
  board: Card[]
  samples: number
}

const scope = self as unknown as {
  addEventListener: (type: 'message', listener: (event: MessageEvent<EquityRequest>) => void) => void
  postMessage: (message: unknown) => void
}

scope.addEventListener('message', event => {
  const { id, hands, board, samples } = event.data
  try {
    scope.postMessage({ id, results: equityMultiway(hands, board, { samples }) })
  } catch (error) {
    scope.postMessage({ id, error: error instanceof Error ? error.message : String(error) })
  }
})
