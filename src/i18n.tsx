import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext } from './i18n-context'
import { getInitialLanguage, persistLanguage, translations, type Language } from './i18n-data'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => getInitialLanguage())

  useEffect(() => {
    persistLanguage(language)
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
    }),
    [language],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
