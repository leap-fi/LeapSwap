import { useConfig as useBigmiConfig } from '@bigmi/react'
import {
  disconnect as bigmiDisconnect,
  getAccount as bigmiGetAccount,
} from '@bigmi/client'
import { ChainType } from '@leapswap/widget-sdk'
import { useWallet } from '@solana/wallet-adapter-react'
import type { Config } from 'wagmi'
import { useConfig as useWagmiConfig } from 'wagmi'
import { disconnect, getAccount } from 'wagmi/actions'
import type { Account } from './useAccount.js'
import { useLastConnectedAccount, useNearAccountStore } from './useAccount.js'
// @ts-ignore - runtime implementation is provided by the host app (widget package)
import { useWalletSelector } from '@near-wallet-selector/react-hook'

export const useAccountDisconnect = () => {
  const bigmiConfig = useBigmiConfig()
  const wagmiConfig = useWagmiConfig()
  const { disconnect: solanaDisconnect } = useWallet()
  const { setNearAccount } = useNearAccountStore()
  const { setLastConnectedAccount } = useLastConnectedAccount()
  const nearWallet = useWalletSelector() as any

  const handleEvmDisconnect = async (config: Config) => {
    const connectedAccount = getAccount(config)
    if (connectedAccount.connector) {
      await disconnect(config, { connector: connectedAccount.connector })
    }
  }

  const handleUtxoDisconnect = async () => {
    const connectedAccount = bigmiGetAccount(bigmiConfig)
    if (connectedAccount.connector) {
      await bigmiDisconnect(bigmiConfig, {
        connector: connectedAccount.connector,
      })
    }
  }

  return async (account: Account) => {
    switch (account.chainType) {
      case ChainType.EVM:
        await handleEvmDisconnect(wagmiConfig)
        break
      case ChainType.UTXO:
        await handleUtxoDisconnect()
        break
      case ChainType.NVM:
        try {
          await nearWallet?.signOut?.()
        } catch (error) {
          console.error('Failed to sign out Near wallet', error)
        }
        setNearAccount(null)
        setLastConnectedAccount(null)
        break
      default:
        await solanaDisconnect()
    }
  }
}
