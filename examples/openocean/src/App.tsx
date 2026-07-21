import { LeapSwapWidget } from '@leapswap/widget'
import { Box, Divider } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { IntegratorSwitch } from './components/IntegratorSwitch'
import { ThemeSwitch } from './components/ThemeSwitch'
import { WalletHeader } from './components/WalletHeader'
import { getIntegrator } from './integrator/getIntegrator'
import type { IntegratorMode } from './integrator/types'
import { defaultThemeId, getThemePreset, type ThemeId } from './theme'

export function App() {
  const queryClient = useQueryClient()
  const [integratorMode, setIntegratorMode] =
    useState<IntegratorMode>('openocean')
  const [themeId, setThemeId] = useState<ThemeId>(defaultThemeId)

  const preset = useMemo(() => getThemePreset(themeId), [themeId])
  const { chrome } = preset
  const { swapDataProvider, chainsProvider } = useMemo(
    () => getIntegrator(integratorMode),
    [integratorMode]
  )

  useEffect(() => {
    document.body.style.background = chrome.pageBg
    document.body.style.color = chrome.text
  }, [chrome])

  const handleIntegratorModeChange = useCallback(
    (mode: IntegratorMode) => {
      if (mode === integratorMode) {
        return
      }
      queryClient.clear()
      setIntegratorMode(mode)
    },
    [integratorMode, queryClient]
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
          width: { xs: '100%', md: 300 },
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          p: 2.5,
          boxSizing: 'border-box',
          minHeight: { xs: 'auto', md: '100vh' },
          bgcolor: chrome.surface,
          borderRight: { xs: 'none', md: `1px solid ${chrome.border}` },
          borderBottom: { xs: `1px solid ${chrome.border}`, md: 'none' },
          boxShadow: chrome.shadow,
        }}
      >
        <WalletHeader chrome={chrome} />
        <Divider sx={{ borderColor: chrome.border }} />
        <ThemeSwitch value={themeId} chrome={chrome} onChange={setThemeId} />
        <Divider sx={{ borderColor: chrome.border }} />
        <IntegratorSwitch
          value={integratorMode}
          chrome={chrome}
          onChange={handleIntegratorModeChange}
        />
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
            key={`${themeId}-${integratorMode}`}
            integrator="vite-example"
            swapDataProvider={swapDataProvider}
            chainsProvider={chainsProvider}
            walletConfig={{
              onConnect: () => console.log('open your walletModal'),
            }}
            config={{
              buildUrl: false,
              dataSourceKey: integratorMode,
              formUpdateKey: integratorMode,
              hiddenUI: ['walletMenu'],
              poweredBy: { name: 'OpenOcean', url: 'https://openocean.finance' },
              subvariant: 'split',
              subvariantOptions: {
                split: 'bridge',
              },
              appearance: preset.appearance,
              theme: preset.widgetTheme,
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}
