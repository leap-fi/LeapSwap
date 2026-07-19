import { useConfig as useBigmiConfig } from '@bigmi/react'
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

  const handleDisconnect = async (config: Config) => {
    const connectedAccount = getAccount(config)
    if (connectedAccount.connector) {
      await disconnect(config, { connector: connectedAccount.connector })
    }
  }

  return async (account: Account) => {
    switch (account.chainType) {
      case ChainType.EVM:
        await handleDisconnect(wagmiConfig)
        break
      case ChainType.UTXO:
        await handleDisconnect(bigmiConfig)
        break
      case ChainType.NVM:
        try {
          // 调用 Near 钱包的 signOut（如果可用）
          await nearWallet?.signOut?.()
        } catch (error) {
          console.error('Failed to sign out Near wallet', error)
        }
        // 清空全局 Near 账户和最近连接记录
        setNearAccount(null)
        setLastConnectedAccount(null)
        break
      default:
        await solanaDisconnect()
    }
  }
}
