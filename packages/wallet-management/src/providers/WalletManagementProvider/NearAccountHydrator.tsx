import { useEffect } from 'react'
import { ChainId, ChainType } from '@leapswap/widget-sdk'
import {
    useLastConnectedAccount,
    useNearAccountStore,
} from '../../hooks/useAccount.js'
// @ts-ignore - runtime implementation is provided by the host app (widget package)
import { useWalletSelector } from '@near-wallet-selector/react-hook'

/**
 * 在应用挂载时，从 Near wallet-selector 中恢复已登录的 Near 账户，
 * 这样刷新页面后 Near 账户也会出现在 useAccount / 钱包菜单中。
 */
export const NearAccountHydrator: React.FC = () => {
    const { setNearAccount } = useNearAccountStore()
    const { setLastConnectedAccount } = useLastConnectedAccount()
    const nearWallet = useWalletSelector() as any

    useEffect(() => {
        if (!nearWallet) return

        // 当前已登录的 Near 账户（如果有）
        const accountId: string | null | undefined = nearWallet.signedAccountId
        if (!accountId) return

        const connectorId: string = nearWallet.id || 'near-wallet'
        const connectorName: string =
            nearWallet.metadata?.name || 'Near Wallet'

        setNearAccount({
            address: accountId,
            chainId: ChainId.NEAR,
            chainType: ChainType.NVM,
            connector: {
                id: connectorId,
                name: connectorName,
            },
            isConnected: true,
            isConnecting: false,
            isReconnecting: false,
            isDisconnected: false,
            status: 'connected',
        })

        setLastConnectedAccount({
            id: connectorId,
            name: connectorName,
        } as any)
    }, [nearWallet?.signedAccountId, nearWallet, setNearAccount, setLastConnectedAccount])

    return null
}

