import { Box, Button, Typography } from '@mui/material'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

const chrome = {
  primary: '#31CB9E',
  primaryDark: '#28a884',
  primaryHoverBg: 'rgba(49, 203, 158, 0.12)',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#ffffff',
  textSecondary: '#9aa3b2',
  radiusSm: '12px',
}

export function WalletHeader() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connectors, connectAsync } = useConnect()

  return (
    <Box display="flex" flexDirection="column" gap={1.25}>
      <Typography fontSize={13} fontWeight={600} sx={{ color: chrome.text }}>
        KyberSwap example
      </Typography>
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
