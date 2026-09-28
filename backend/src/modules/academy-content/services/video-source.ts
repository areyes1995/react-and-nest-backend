// ──────────────────────────────────────────────
// Normalización de la fuente de video.
// El administrador pega lo que tenga a mano: la URL de
// la barra del navegador, un enlace de "compartir" o
// un ID suelto. Aquí se reduce todo a lo que necesita
// el reproductor del frontend.
// ──────────────────────────────────────────────

import { VideoProviderId } from '../dtos/academy-content.dto';

export interface NormalizedVideo {
  provider: VideoProviderId;
  /** ID del video (YouTube/Vimeo) o URL directa (MP4). `null` si no hay fuente. */
  value: string | null;
}

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?[^#]*\bv=)([A-Za-z0-9_-]{11})/,
  /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
  /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
];

const VIMEO_PATTERNS = [/vimeo\.com\/(?:video\/)?(\d{6,})/];

export function normalizeVideo(
  provider: VideoProviderId | undefined,
  rawUrl: string | undefined | null,
): NormalizedVideo {
  const url = (rawUrl ?? '').trim();

  if (!provider || provider === 'NONE' || !url) {
    return { provider: provider === 'NONE' || !provider ? 'NONE' : provider, value: null };
  }

  if (provider === 'YOUTUBE') {
    for (const pattern of YOUTUBE_PATTERNS) {
      const match = url.match(pattern);
      if (match) return { provider, value: match[1] };
    }
    // Ya venía como ID suelto.
    if (/^[A-Za-z0-9_-]{11}$/.test(url)) return { provider, value: url };
    return { provider, value: null };
  }

  if (provider === 'VIMEO') {
    for (const pattern of VIMEO_PATTERNS) {
      const match = url.match(pattern);
      if (match) return { provider, value: match[1] };
    }
    if (/^\d{6,}$/.test(url)) return { provider, value: url };
    return { provider, value: null };
  }

  // MP4: se exige un enlace http(s) para no inyectar rutas raras en el <video>.
  if (/^https?:\/\//i.test(url)) return { provider, value: url };
  return { provider, value: null };
}
