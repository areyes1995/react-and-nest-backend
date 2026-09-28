// ──────────────────────────────────────────────
// XpToast — "+12 XP" que sube y se desvanece cada
// vez que el estudiante gana puntos, esté donde esté
// (clase, mesa, entrenador…), y un aviso más grande
// al subir de nivel.
//
// La recompensa inmediata es lo que convierte una
// acción en hábito: el estudiante ve al instante que
// lo que acaba de hacer suma.
// ──────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trophy, Zap } from 'lucide-react'
import { useStudentProgress } from '@features/progress/ProgressContext'

interface Burst {
  id: number
  amount: number
  level?: number
}

export default function XpToast() {
  const { progress, level } = useStudentProgress()
  const [bursts, setBursts] = useState<Burst[]>([])
  const previous = useRef({ xp: progress.xp, level: level.level })
  const nextId = useRef(0)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  useEffect(() => {
    const gained = progress.xp - previous.current.xp
    const leveledUp = level.level > previous.current.level
    previous.current = { xp: progress.xp, level: level.level }
    // Solo subidas: un reinicio del progreso no es una recompensa.
    if (gained <= 0) return

    const id = ++nextId.current
    setBursts(current => [...current.slice(-2), { id, amount: gained, level: leveledUp ? level.level : undefined }])
    // Cada aviso se retira solo; no se cancela si llega otro (se apilan).
    timers.current.push(
      window.setTimeout(() => setBursts(current => current.filter(b => b.id !== id)), leveledUp ? 3200 : 1900),
    )
  }, [progress.xp, level.level])

  if (bursts.length === 0) return null

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-16 z-[150] flex flex-col items-end gap-2" aria-live="polite">
      {bursts.map(burst =>
        burst.level ? (
          <div
            key={burst.id}
            className="animate-pop-in flex items-center gap-3 rounded-2xl border border-[#f2a93b]/50 bg-[#15161b]/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur"
          >
            <span
              className="grid place-items-center w-10 h-10 rounded-xl text-black"
              style={{ background: 'linear-gradient(180deg, #fcd67a, #f2a93b)', boxShadow: '0 3px 0 0 #b7791f' }}
            >
              <Trophy className="w-5 h-5" strokeWidth={2.4} />
            </span>
            <span>
              <span className="block text-caption font-bold uppercase tracking-wider text-[#f2a93b]">¡Subiste de nivel!</span>
              <span className="block text-base font-extrabold text-white">Nivel {burst.level} · +{burst.amount} XP</span>
            </span>
          </div>
        ) : (
          <span
            key={burst.id}
            className="animate-xp-float inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-extrabold text-black shadow-lg"
            style={{ background: 'linear-gradient(180deg, #fcd67a, #f2a93b)', boxShadow: '0 3px 0 0 #b7791f' }}
          >
            <Zap className="w-4 h-4" strokeWidth={2.6} fill="currentColor" />+{burst.amount} XP
          </span>
        ),
      )}
    </div>,
    document.body,
  )
}
