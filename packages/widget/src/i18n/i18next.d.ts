import 'i18next'
import 'react-i18next'
import en from './en.json' with { type: 'json' }

const defaultResource = { translation: en }

// Completely override i18next module
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: typeof defaultResource
    keySeparator?: false
  }
  
  // Override the t function to accept any string
  function t(key: string, options?: any): string;
  
  // Override TFunction type
  type TFunction = (key: string, options?: any) => string;
}

// Completely override react-i18next module
declare module 'react-i18next' {
  // Override useTranslation hook
  function useTranslation(): {
    t: (key: string, options?: any) => string
    i18n: any
    ready: boolean
    // ...other hooks
  }
  
  // Override TFunction type
  type TFunction = (key: string, options?: any) => string;
  
  // Override other related types
  interface UseTranslationOptions {
    keyPrefix?: string
    ns?: string | string[]
  }
}
