import { LeapSwapWidget, leapSwapTheme } from '@leapswap/widget'
import { Box, Divider, Typography } from '@mui/material'
import { useEffect } from 'react'
import { WalletHeader } from './components/WalletHeader'
import { chainsProvider, swapDataProvider } from './integrator'

const chrome = {
  pageBg: '#0b1215',
  surface: '#121a1e',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#ffffff',
  textSecondary: '#9aa3b2',
}

export function App() {
  useEffect(() => {
    document.body.style.background = chrome.pageBg
    document.body.style.color = chrome.text
  }, [])

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
        <Divider sx={{ borderColor: chrome.border }} />
        <Typography fontSize={12} sx={{ color: chrome.textSecondary, lineHeight: 1.5 }}>
          Local integrator adapts KyberSwap Aggregator API v1 to Widget{' '}
          <code>SwapDataProvider</code>. See{' '}
          <code>src/integrator/</code>.
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
            config={{
              buildUrl: false,
              dataSourceKey: 'kyberswap',
              hiddenUI: ['walletMenu'],
              poweredBy: {
                name: 'KyberSwap',
                url: 'https://kyberswap.com',
              },
              subvariant: 'split',
              subvariantOptions: {
                split: 'bridge',
              },
              appearance: 'dark',
              theme: leapSwapTheme,
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}
