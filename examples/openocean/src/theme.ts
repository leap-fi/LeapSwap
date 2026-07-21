import type { Appearance, WidgetTheme } from '@leapswap/widget'
import { leapSwapTheme, watermelonLightTheme } from '@leapswap/widget'

export type ThemeId = 'leapswap' | 'default' | 'watermelon'

export interface ExampleChrome {
  primary: string
  primaryDark: string
  primaryHoverBg: string
  pageBg: string
  surface: string
  border: string
  text: string
  textSecondary: string
  radius: string
  radiusSm: string
  shadow: string
}

export interface ExampleThemePreset {
  id: ThemeId
  label: string
  tip: string
  appearance: Appearance
  chrome: ExampleChrome
  widgetTheme: WidgetTheme
}

const sharedShape = {
  radius: '16px',
  radiusSm: '12px',
} as const

/** Default dark LeapSwap brand theme. */
const leapswap: ExampleThemePreset = {
  id: 'leapswap',
  label: 'Dark',
  tip: 'Dark theme',
  appearance: 'dark',
  chrome: {
    primary: '#6E6A8A',
    primaryDark: '#5A5674',
    primaryHoverBg: 'rgba(255, 255, 255, 0.06)',
    pageBg: '#17122B',
    surface: '#29273D',
    border: 'rgba(255, 255, 255, 0.08)',
    text: '#ffffff',
    textSecondary: '#8C7F8C',
    shadow: '0px 8px 32px rgba(0, 0, 0, 0.32)',
    ...sharedShape,
  },
  widgetTheme: {
    ...leapSwapTheme,
    container: {
      ...leapSwapTheme.container,
      border: '1px solid rgba(255, 255, 255, 0.08)',
    },
  },
}

const defaultLight: ExampleThemePreset = {
  id: 'default',
  label: 'Light',
  tip: 'Light theme',
  appearance: 'light',
  chrome: {
    primary: '#5C67FF',
    primaryDark: '#4A54E0',
    primaryHoverBg: 'rgba(92, 103, 255, 0.08)',
    pageBg: '#fafafa',
    surface: '#ffffff',
    border: 'rgb(234, 234, 234)',
    text: '#000000',
    textSecondary: '#747474',
    shadow: '0px 8px 32px rgba(0, 0, 0, 0.08)',
    ...sharedShape,
  },
  widgetTheme: {
    container: {
      border: '1px solid rgb(234, 234, 234)',
      borderRadius: '16px',
      boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.08)',
    },
  },
}

const watermelon: ExampleThemePreset = {
  id: 'watermelon',
  label: 'Watermelon',
  tip: 'Watermelon light theme',
  appearance: 'light',
  chrome: {
    primary: '#f7557c',
    primaryDark: '#e0456c',
    primaryHoverBg: 'rgba(247, 85, 124, 0.1)',
    // Match widget palette.background.default — not the loud playground pink
    pageBg: '#ffeff3',
    surface: '#ffffff',
    border: '#F0E5E8',
    text: '#190006',
    textSecondary: '#766066',
    shadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
    ...sharedShape,
  },
  widgetTheme: {
    ...watermelonLightTheme,
    playground: {
      background: '#ffeff3',
    },
    container: {
      ...watermelonLightTheme.container,
      border: '1px solid #F0E5E8',
    },
  },
}

export const themePresets: Record<ThemeId, ExampleThemePreset> = {
  leapswap,
  default: defaultLight,
  watermelon,
}

export const themePresetList = Object.values(themePresets)

export const defaultThemeId: ThemeId = 'leapswap'

export function getThemePreset(id: ThemeId): ExampleThemePreset {
  return themePresets[id] ?? leapswap
}
