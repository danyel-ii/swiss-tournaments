import { createContext } from 'react'
import type { Language, TranslationSet } from './i18n-data'

export interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: TranslationSet
}

export const I18nContext = createContext<I18nContextValue | null>(null)
