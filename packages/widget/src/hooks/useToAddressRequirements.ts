import { useAccount } from '@leapswap/wallet-management'
import type { RouteExtended } from '@leapswap/widget-sdk'
import { useChain } from '../hooks/useChain.js'
import { useWidgetConfig } from '../providers/WidgetProvider/WidgetProvider.js'
import { useFieldValues } from '../stores/form/useFieldValues.js'
import { RequiredUI } from '../types/widget.js'
import { useIsContractAddress } from './useIsContractAddress.js'

export const useToAddressRequirements = (route?: RouteExtended) => {
  const { requiredUI } = useWidgetConfig()
  const [formFromChainId, formToChainId, formToAddress] = useFieldValues(
    'fromChain',
    'toChain',
    'toAddress'
  )

  const fromChainId = route?.fromChainId ?? formFromChainId
  const toChainId = route?.toChainId ?? formToChainId
  const toAddress = route
    ? route.fromAddress !== route.toAddress
      ? route.toAddress
      : formToAddress
    : formToAddress

  const { chain: fromChain } = useChain(fromChainId)
  const { chain: toChain } = useChain(toChainId)
  const { account } = useAccount({
    chainType: fromChain?.chainType,
  })
  const { isContractAddress: isFromContractAddress } = useIsContractAddress(
    account.address,
    fromChainId,
    account.chainType
  )

  const isDifferentChainType =
    fromChain && toChain && fromChain.chainType !== toChain.chainType

  const requiredToAddress =
    requiredUI?.includes(RequiredUI.ToAddress) ||
    isDifferentChainType

  return {
    requiredToAddress,
    requiredToChainType: toChain?.chainType,
    toAddress,
  }
}
