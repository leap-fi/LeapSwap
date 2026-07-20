import { Box, Button, Typography } from '@mui/material'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import type { ExampleChrome } from '../theme.js'

interface WalletHeaderProps {
  chrome: ExampleChrome
}

export function WalletHeader({ chrome }: WalletHeaderProps) {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connectors, connectAsync } = useConnect()

  return (
    <Box display="flex" flexDirection="column" gap={1.25}>
      {address ? (
        <Typography
          fontSize={12}
          sx={{ color: chrome.textSecondary, wordBreak: 'break-all' }}
        >
          {address}
        </Typography>
      ) : (
        <Typography fontSize={13} sx={{ color: chrome.textSecondary }}>
          Wallet not connected
        </Typography>
      )}
      {!isConnected ? (
        <Button
          variant="contained"
          disableElevation
          size="small"
          onClick={() => connectAsync({ connector: connectors[0] })}
          sx={{
            alignSelf: 'flex-start',
            bgcolor: chrome.primary,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: chrome.radiusSm,
            '&:hover': { bgcolor: chrome.primaryDark },
          }}
        >
          Connect
        </Button>
      ) : (
        <Button
          variant="outlined"
          disableElevation
          size="small"
          onClick={() => disconnect()}
          sx={{
            alignSelf: 'flex-start',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: chrome.radiusSm,
            borderColor: chrome.border,
            color: chrome.text,
            '&:hover': {
              borderColor: chrome.primary,
              bgcolor: chrome.primaryHoverBg,
            },
          }}
        >
          Disconnect
        </Button>
      )}
    </Box>
  )
}
