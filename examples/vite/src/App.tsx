import { LeapSwapWidget } from '@leapswap/widget'
import { Box } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { IntegratorSwitch } from './components/IntegratorSwitch'
import { getIntegrator } from './integrator/getIntegrator'
import type { IntegratorMode } from './integrator/types'

export function App() {
  const queryClient = useQueryClient()
  const [integratorMode, setIntegratorMode] =
    useState<IntegratorMode>('openocean')
  const { swapDataProvider, chainsProvider } = useMemo(
    () => getIntegrator(integratorMode),
    [integratorMode]
  )

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
    <Box maxWidth={480} mx="auto" px={2} pb={4}>
      <IntegratorSwitch
        value={integratorMode}
        onChange={handleIntegratorModeChange}
      />
      <LeapSwapWidget
        key={integratorMode}
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
          poweredBy: { name: 'Your Brand', url: 'https://example.com' },
          subvariant: 'split',
          subvariantOptions: {
            split: 'bridge',
          },
          theme: {
            container: {
              border: '1px solid rgb(234, 234, 234)',
              borderRadius: '16px',
            },
          },
        }}
      />
    </Box>
  )
}
