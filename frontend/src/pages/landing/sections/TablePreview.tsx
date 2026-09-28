// ──────────────────────────────────────────────
// TablePreview — la mesa real de la plataforma.
// Mismo motor y mismos componentes que la mesa de
// práctica, con semilla fija: la portada enseña
// siempre la misma mano.
//
// Va en su propio módulo porque arrastra el motor
// de juego; la sección lo carga en diferido para
// que la portada no lo descargue de entrada.
// ──────────────────────────────────────────────

import { useMemo } from 'react'
import { createTable, makeCard, startHand, type SeatSetup } from '@poker/engine'
import { PokerTable } from '@components/poker'

const SEATS: SeatSetup[] = [
  { id: 'hero', name: 'Tú', isHuman: true },
  { id: 'b1', name: 'Marta', botProfile: 'tag' },
  { id: 'b2', name: 'Diego', botProfile: 'station' },
  { id: 'b3', name: 'Nadia', botProfile: 'nit' },
  { id: 'b4', name: 'Bruno', botProfile: 'lag' },
  { id: 'b5', name: 'Elena', botProfile: 'tag' },
]

export default function TablePreview() {
  const state = useMemo(() => {
    const table = startHand(createTable({ smallBlind: 25, bigBlind: 50, startingStack: 5000 }, SEATS, 2024))
    const hero = table.players.find(player => player.id === 'hero')
    if (hero) {
      // Mano premium para la portada en vez del 9 2 aleatorio de la semilla.
      const previous = [...hero.holeCards]
      const next: typeof previous = [makeCard(14, 's'), makeCard(13, 'h')]
      hero.holeCards = next
      // Evita duplicados en el mazo restante intercambiando las cartas originales.
      for (let i = 0; i < next.length; i++) {
        const idx = table.deck.indexOf(next[i])
        if (idx !== -1) table.deck[idx] = previous[i]
      }
    }
    return table
  }, [])

  return <PokerTable state={state} heroId="hero" timeLeft={0.6} revealAll={false} settings={false} />
}
