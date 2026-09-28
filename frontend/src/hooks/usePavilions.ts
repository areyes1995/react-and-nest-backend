// ──────────────────────────────────────────────
// usePavilions — hook para catálogo dinámico de pabellones
// Lee /config/catalogs (activos). Si falla, hace fallback
// a PROJECT_AREAS hardcodeado para no romper la UI.
// ──────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react'
import { listPavilions, type PavilionArea } from '@services/catalogs'

const PROJECT_AREAS = ['Tech', 'Design', 'Media', 'AI']

export interface UsePavilionsReturn {
  pavilions: PavilionArea[]
  labels: string[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const FALLBACK_PAVILIONS: PavilionArea[] = PROJECT_AREAS.map((label, i) => ({
  id: 1000 + i,
  key: label.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20) || `AREA_${i}`,
  label,
  pavilion: `Pabellón ${label}`,
  tagline: '',
  description: '',
  accent: ['#7c5cff', '#22b8cf', '#ff5d73', '#ff9f43'][i % 4],
  icon: ['cpu', 'code', 'shield', 'spark'][i % 4],
  keywords: [label.toLowerCase()],
  sortOrder: i,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}))

export function usePavilions(): UsePavilionsReturn {
  const [pavilions, setPavilions] = useState<PavilionArea[]>(FALLBACK_PAVILIONS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listPavilions(false)
      if (res.ok && Array.isArray(res.data) && res.data.length) {
        setPavilions(res.data)
      } else if (!res.ok) {
        // backend no disponible (mock) → mantener fallback sin marcar error ruidoso
        setError(res.error ?? null)
      }
    } catch (e) {
      setError((e as Error)?.message ?? 'Error cargando pabellones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetch()
  }, [fetch])

  const labels = pavilions.filter(p => p.isActive).map(p => p.label)

  return { pavilions, labels: labels.length ? labels : PROJECT_AREAS, loading, error, refresh: fetch }
}
