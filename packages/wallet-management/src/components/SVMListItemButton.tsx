import { Avatar, ListItemAvatar } from '@mui/material'
import { ChainId, ChainType } from '@leapswap/widget-sdk'
import type { WalletAdapter } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { ListItemButton } from '../components/ListItemButton.js'
import { ListItemText } from '../components/ListItemText.js'
import { useLastConnectedAccount } from '../hooks/useAccount.js'
import { useWalletManagementEvents } from '../hooks/useWalletManagementEvents.js'
import { WalletManagementEvent } from '../types/events.js'
import type { WalletListItemButtonProps } from './types.js'

interface SVMListItemButtonProps extends WalletListItemButtonProps {
  walletAdapter: WalletAdapter
}

export const SVMListItemButton = ({
  ecosystemSelection,
  walletAdapter,
  onConnected,
  onConnecting,
  onError,
}: SVMListItemButtonProps) => {
  const emitter = useWalletManagementEvents()
  const { select, disconnect, connected } = useWallet()
  const { setLastConnectedAccount } = useLastConnectedAccount()

  const connectorName = walletAdapter.name
  const connectorDisplayName: string = ecosystemSelection
    ? 'Solana'
    : walletAdapter.name

  const connectWallet = async () => {
    try {
      onConnecting?.()
      if (connected) {
        await disconnect()
      }
      select(walletAdapter.name)
      // We use autoConnect on wallet selection
      // await connect()
      walletAdapter.once('connect', (publicKey: any) => {
        setLastConnectedAccount(walletAdapter)
        emitter.emit(WalletManagementEvent.WalletConnected, {
          address: publicKey?.toString(),
          chainId: ChainId.SOL,
          chainType: ChainType.SVM,
          connectorId: connectorName,
          connectorName: connectorName,
        })
      })
      onConnected?.()
    } catch (error) {
      onError?.(error)
    }
  }

  return (
    <ListItemButton key={connectorDisplayName} onClick={connectWallet}>
      <ListItemAvatar>
        <Avatar
          src={
            ecosystemSelection
              ? 'https://s3.leapswap.finance/token_logos/logos/1745547977998_539267174675113.svg'
              : walletAdapter.icon
          }
          alt={connectorDisplayName}
        >
          {connectorDisplayName[0]}
        </Avatar>
      </ListItemAvatar>
      <ListItemText primary={connectorDisplayName} />
    </ListItemButton>
  )
}
