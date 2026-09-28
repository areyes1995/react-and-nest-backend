// ──────────────────────────────────────────────
// i18n — Language system (i18next + react-i18next)
// ──────────────────────────────────────────────

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import es from './locales/es.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', labelKey: 'settings.language.english' },
  { code: 'es', labelKey: 'settings.language.spanish' },
] as const

const LANGUAGE_KEY = 'modu_language'

const savedLanguage = localStorage.getItem(LANGUAGE_KEY)

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: savedLanguage ?? 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_KEY,
      caches: ['localStorage'],
    },
  })

export function changeLanguage(language: string) {
  i18n.changeLanguage(language)
  localStorage.setItem(LANGUAGE_KEY, language)
}

export default i18n