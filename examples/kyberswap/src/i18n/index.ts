import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import zh from './zh.json'

/** Host-app locales that also exist in `@leapswap/widget` built-in packs. */
export const hostLocales = ['en', 'zh'] as const
export type HostLocale = (typeof hostLocales)[number]

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  lowerCaseLng: true,
  interpolation: { escapeValue: false },
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
})

export default i18n
