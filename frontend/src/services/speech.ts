// ──────────────────────────────────────────────
// Voz en línea (Edge) para "Escuchar la clase".
// La sirve el servicio `translate/` (`/voices` y
// `/speak`, ver su README): voces neuronales en
// cualquier idioma, sin instalar nada. Solo
// transporte: qué voz usar lo decide `useReadAloud`.
// ──────────────────────────────────────────────

import { TRANSLATE_URL } from './translate'

export interface CloudVoice {
  /** `fr-FR-DeniseNeural`. */
  id: string
  /** BCP 47: `fr-FR`. */
  lang: string
  /** "Microsoft Denise Online (Natural) - French (France)". */
  name: string
  gender?: string
}

let voicesRequest: Promise<CloudVoice[]> | null = null

/** Voces en línea (una petición por sesión). Vacío = servicio caído o sin voz. */
export function fetchCloudVoices(): Promise<CloudVoice[]> {
  if (!TRANSLATE_URL) return Promise.resolve([])
  voicesRequest ??= fetch(`${TRANSLATE_URL}/voices`)
    .then(res => (res.ok ? res.json() : { voices: [] }))
    .then((data: { voices?: unknown }) =>
      Array.isArray(data.voices)
        ? (data.voices as CloudVoice[]).filter(v => typeof v?.id === 'string' && typeof v.lang === 'string')
        : [],
    )
    .catch(() => [])
    .then(voices => {
      // Si falló, se vuelve a probar en la próxima clase.
      if (voices.length === 0) voicesRequest = null
      return voices
    })
  return voicesRequest
}

/** URL del audio de una frase: el servicio lo manda en streaming (MP3). */
export function speechUrl(text: string, voice: string): string {
  return `${TRANSLATE_URL}/speak?${new URLSearchParams({ voice, text })}`
}
