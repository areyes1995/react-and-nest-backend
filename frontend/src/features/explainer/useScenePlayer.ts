// ──────────────────────────────────────────────
// useScenePlayer — reproduce una escena explicativa.
//
// Dos maneras de avanzar:
//  · con voz: la escena se narra con el mismo lector
//    que "Escuchar la clase" (misma voz, idioma y
//    velocidad) y cada paso empieza cuando empieza su
//    frase;
//  · en silencio: los pasos avanzan con un tiempo
//    que depende de lo largo que es el texto. Es lo
//    que se usa mientras suena el audio de la clase,
//    para no tener dos voces a la vez.
// Dentro de un paso, las acciones se aplican de una
// en una para que se vean las fichas moverse.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TableState } from '@poker/engine'
import { useReadAloud } from '@features/speech/useReadAloud'
import { cleanForSpeech } from '@features/speech/lessonScript'
import { buildScene } from './script'
import type { ExplainerScene } from './types'

/** Tiempo entre dos acciones de un mismo paso. */
const ACTION_MS = 750
/** Lectura en silencio: tiempo mínimo por paso y por carácter. */
const MIN_BEAT_MS = 2800
const MS_PER_CHAR = 55

export type PlayMode = 'voice' | 'silent'

export interface ScenePlayerOptions {
  /**
   * La explicación llegó al final por sí sola (con voz o en silencio). No se
   * llama al pausarla ni al pararla: así quien la lanzó sabe cuándo retomar.
   */
  onFinish?: () => void
}

export function useScenePlayer(scene: ExplainerScene, { onFinish }: ScenePlayerOptions = {}) {
  const frames = useMemo(() => buildScene(scene), [scene])
  const lines = useMemo(() => scene.beats.map(beat => beat.say), [scene])
  // Lo que se lee: igual que el subtítulo pero con cifras y siglas en palabras
  // ("1.200" → "mil doscientos"), como el guion de la clase.
  const spoken = useMemo(() => lines.map(cleanForSpeech), [lines])

  /** Paso actual; -1 = antes de empezar (la mesa recién repartida). */
  const [beat, setBeat] = useState(-1)
  /** Acción del paso que ya se ve. */
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<PlayMode | null>(null)
  const playing = mode !== null
  // Refs para los callbacks del lector, que se crean una vez.
  const modeRef = useRef<PlayMode | null>(null)
  modeRef.current = mode
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish

  const narrator = useReadAloud(spoken, {
    resetKey: scene.id,
    onEnd: () => {
      if (modeRef.current !== 'voice') return
      setMode(null)
      finishRef.current?.()
    },
  })

  // Escena nueva: vuelve al principio.
  useEffect(() => {
    setBeat(-1)
    setStep(0)
    setMode(null)
  }, [scene])

  const enter = useCallback((target: number) => {
    setBeat(target)
    setStep(0)
  }, [])

  // ── Con voz: el paso sigue a la frase que suena ──
  useEffect(() => {
    if (mode === 'voice' && narrator.current !== null && narrator.current !== beat) enter(narrator.current)
  }, [mode, narrator.current, beat, enter])

  // Si la voz se calla desde fuera (otra mesa o la clase toman la palabra),
  // el botón vuelve a reproducir en vez de quedarse en "Pausar". Se conserva
  // el paso para retomar donde iba. La pausa propia ya deja el modo en null
  // en el mismo gesto, así que aquí solo entra lo externo.
  useEffect(() => {
    if (mode === 'voice' && narrator.status === 'paused') setMode(null)
  }, [mode, narrator.status])

  // Si la voz falla (sin voces, audio bloqueado…), la escena se queda donde está
  // en vez de fingir que sigue sonando.
  useEffect(() => {
    if (mode === 'voice' && narrator.error) setMode(null)
  }, [mode, narrator.error])

  // ── Acciones del paso, una a una ──
  const states = beat >= 0 ? frames.beats[beat].states : [frames.initial]
  const lastStep = states.length - 1
  useEffect(() => {
    if (step >= lastStep) return
    const timer = window.setTimeout(() => setStep(current => current + 1), step === 0 ? 350 : ACTION_MS)
    return () => window.clearTimeout(timer)
  }, [step, lastStep, beat])

  // ── En silencio: el paso siguiente llega por tiempo ──
  const rateRef = useRef(narrator.rate)
  rateRef.current = narrator.rate
  useEffect(() => {
    if (mode !== 'silent' || beat < 0) return
    const text = lines[beat] ?? ''
    const actions = frames.beats[beat].states.length - 1
    const wait = Math.max(MIN_BEAT_MS, text.length * MS_PER_CHAR, actions * ACTION_MS + 1200) / rateRef.current
    const timer = window.setTimeout(() => {
      if (beat + 1 < lines.length) {
        enter(beat + 1)
      } else {
        setMode(null)
        finishRef.current?.()
      }
    }, wait)
    return () => window.clearTimeout(timer)
  }, [mode, beat, lines, frames, enter])

  const play = useCallback(
    (as: PlayMode, from?: number) => {
      const start = from ?? (beat < 0 || beat >= lines.length - 1 ? 0 : beat)
      enter(start)
      setMode(as)
      if (as === 'voice') narrator.play(start)
      else narrator.stop()
    },
    [beat, lines.length, enter, narrator],
  )

  const pause = useCallback(() => {
    if (mode === 'voice') narrator.pause()
    setMode(null)
  }, [mode, narrator])

  /** Mueve la escena a un paso; si se está narrando, la voz salta con ella. */
  const goTo = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(lines.length - 1, target))
      enter(clamped)
      if (mode === 'voice') narrator.play(clamped)
    },
    [lines.length, enter, mode, narrator],
  )

  const state: TableState = states[Math.min(step, lastStep)]

  return {
    frames,
    state,
    /** Paso actual (-1 antes de empezar). */
    beat,
    total: lines.length,
    caption: beat >= 0 ? lines[beat] : null,
    reveal: beat >= 0 && frames.beats[beat].reveal,
    finished: !playing && beat === lines.length - 1 && step >= lastStep,
    playing,
    mode,
    /** La voz se está preparando (traducción o audio en línea). */
    buffering: mode === 'voice' && narrator.buffering,
    voiceSupported: narrator.supported,
    voiceError: narrator.error,
    /** Voces disponibles para narrar la mesa (las mismas que "Escuchar la clase"). */
    voices: narrator.voices,
    voiceId: narrator.voiceId,
    setVoice: narrator.setVoice,
    play,
    pause,
    /** Vuelve a empezar la explicación, con la voz o en silencio. */
    replay: (as: PlayMode) => play(as, 0),
    goTo,
    stop: () => {
      narrator.stop()
      setMode(null)
    },
  }
}

export type ScenePlayer = ReturnType<typeof useScenePlayer>
