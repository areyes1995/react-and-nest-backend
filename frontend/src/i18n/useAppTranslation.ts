// ──────────────────────────────────────────────
// useAppTranslation — useTranslation wrapper that
// lets you opt out of translating specific strings.
// Pass `{ noTranslate: true }` to keep the original.
// ──────────────────────────────────────────────

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export interface TranslateOptions {
  noTranslate?: boolean
  [key: string]: unknown
}

export type AppTFunction = (key: string, options?: TranslateOptions) => string

export function useAppTranslation() {
  const { t: baseT, i18n } = useTranslation()

  const t = useCallback<AppTFunction>(
    (key, options) => {
      if (options?.noTranslate) return key
      if (!options) return baseT(key) as string
      const { noTranslate: _nt, ...vars } = options
      return baseT(key, vars) as string
    },
    [baseT],
  )

  return useMemo(() => ({ t, i18n }), [t, i18n])
}

export function getNoTranslate(): TranslateOptions {
  return { noTranslate: true }
}