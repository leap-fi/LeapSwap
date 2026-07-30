import { LeapSwapWidget, leapSwapTheme, HiddenUI } from '@leapswap/widget'
import { Box, Divider, Typography } from '@mui/material'
import { useEffect, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { WalletHeader } from './components/WalletHeader'
import type { HostLocale } from './i18n'
import { hostLocales } from './i18n'
import { chainsProvider, swapDataProvider } from './integrator'

const chrome = {
  pageBg: '#0b1215',
  surface: '#121a1e',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#ffffff',
  textSecondary: '#9aa3b2',
}

function resolveHostLocale(language?: string): HostLocale {
  const code = (language || 'en').split('-')[0].toLowerCase()
  return code === 'zh' ? 'zh' : 'en'
}

export function App() {
  const { i18n } = useTranslation()
  const locale = resolveHostLocale(i18n.resolvedLanguage || i18n.language)

  useEffect(() => {
    document.body.style.background = chrome.pageBg
    document.body.style.color = chrome.text
    document.documentElement.lang = locale
  }, [locale])

  // Drive Widget i18n from the host locale (Widget creates its own i18next instance).
  const widgetConfig = useMemo(
    () => ({
      buildUrl: false,
      dataSourceKey: 'kyberswap',
      // Outer app owns language UX; hide Widget settings entry.
      hiddenUI: [HiddenUI.WalletMenu, HiddenUI.Language],
      poweredBy: {
        name: 'KyberSwap',
        url: 'https://kyberswap.com',
      },
      subvariant: 'split' as const,
      subvariantOptions: {
        split: 'bridge' as const,
      },
      appearance: 'dark' as const,
      theme: leapSwapTheme,
      languages: {
        default: locale,
        allow: [...hostLocales],
      },
    }),
    [locale]
  )

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'stretch',
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          width: { xs: '100%', md: 280 },
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 2.5,
          boxSizing: 'border-box',
          minHeight: { xs: 'auto', md: '100vh' },
          bgcolor: chrome.surface,
          borderRight: { xs: 'none', md: `1px solid ${chrome.border}` },
          borderBottom: { xs: `1px solid ${chrome.border}`, md: 'none' },
        }}
      >
        <WalletHeader />
        <LanguageSwitcher />
        <Divider sx={{ borderColor: chrome.border }} />
        <Typography fontSize={12} sx={{ color: chrome.textSecondary, lineHeight: 1.5 }}>
          <Trans
            i18nKey="app.sidebarHint"
            components={{ code: <code /> }}
          />
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, md: 3 },
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          <LeapSwapWidget
            integrator="kyberswap-example"
            swapDataProvider={swapDataProvider}
            chainsProvider={chainsProvider}
            walletConfig={{
              onConnect: () => console.log('open your walletModal'),
            }}
            config={widgetConfig}
          />
        </Box>
      </Box>
    </Box>
  )
}
