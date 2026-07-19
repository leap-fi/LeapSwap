import { Button } from '@mui/material'
import { useAccount, useWalletMenu } from '@leapswap/wallet-management'
import { ChainType } from '@leapswap/widget-sdk'
import { useTranslation } from 'react-i18next'
import { useChain } from '../../hooks/useChain.js'
import { useWidgetConfig } from '../../providers/WidgetProvider/WidgetProvider.js'
import { useFieldValues } from '../../stores/form/useFieldValues.js'
import type { BaseTransactionButtonProps } from './types.js'
import { useWalletSelector } from '@near-wallet-selector/react-hook'

export const BaseTransactionButton: React.FC<BaseTransactionButtonProps> = ({
  onClick,
  text,
  disabled,
  loading,
}) => {
  const { t } = useTranslation()
  const { walletConfig } = useWidgetConfig()
  const { openWalletMenu } = useWalletMenu()
  const [fromChainId] = useFieldValues('fromChain')
  const { chain } = useChain(fromChainId)
  const { account } = useAccount({ chainType: chain?.chainType })
  const nearWallet = useWalletSelector() as any
  const isNearChain = chain?.chainType === ChainType.NVM
  const handleClick = async () => {
    if (account.isConnected) {
      onClick?.()
    } else if (isNearChain && nearWallet) {
      // Near 链：不打开内部钱包菜单，直接调用 Near wallet-selector 的登录流程，
      // 只展示 Near 自己的 UI（用户在其中选择 Meteor / Sender 等钱包）。
      await nearWallet.signIn?.({
        contractId: '',
        methodNames: [],
      })
      // 修改 .modal-left-title 下的 h2 标签文本为英文"Connect Wallet"
      const interval = setInterval(() => {
        const h2 = document.querySelector('.modal-left-title h2');
        if (h2 && h2.textContent !== 'Connect Wallet') {
          h2.textContent = 'Connect Wallet';
          clearInterval(interval);
        }
      }, 50);
      setTimeout(() => clearInterval(interval), 3000); // 最长执行3秒
    } else if (walletConfig?.onConnect) {
      walletConfig.onConnect()
    } else {
      openWalletMenu(
        chain?.chainType ? { chainType: chain.chainType } : undefined
      )
    }
  }

  const getButtonText = () => {
    if (account.isConnected) {
      if (text) {
        return text
      }
    }
    return t('button.connectWallet')
  }

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={handleClick}
      disabled={account.isConnected && disabled}
      loading={loading}
      loadingPosition="center"
      fullWidth
    >
      {getButtonText()}
    </Button>
  )
}
