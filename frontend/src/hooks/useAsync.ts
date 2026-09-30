import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

export interface AsyncState<T> {
  data: T | undefined
  error: string | null
  loading: boolean
  reload: () => Promise<void>
  setData: (updater: T | ((prev: T | undefined) => T)) => void
}

/** Carga datos asíncronos con estado de carga/error y recarga manual. */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList = [], enabled = true): AsyncState<T> {
  const [data, setDataState] = useState<T>()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(enabled)
  const seq = useRef(0)

  const run = useCallback(async () => {
    if (!enabled) return
    const id = ++seq.current
    setLoading(true)
    setError(null)
    try {
      const result = await fn()
      if (id === seq.current) setDataState(result)
    } catch (err) {
      if (id === seq.current) setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      if (id === seq.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled])

  useEffect(() => {
    void run()
  }, [run])

  const setData = useCallback((updater: T | ((prev: T | undefined) => T)) => {
    setDataState((prev) => (typeof updater === 'function' ? (updater as (p: T | undefined) => T)(prev) : updater))
  }, [])

  return { data, error, loading, reload: run, setData }
}
