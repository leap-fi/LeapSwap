import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { BaseTransactionButton } from '../../components/BaseTransactionButton/BaseTransactionButton.js'
import {
  useMessageQueue,
  useStorePriceImpactAcknowledged,
} from '../../components/Messages/useMessageQueue.js'
import { useRoutes } from '../../hooks/useRoutes.js'
import { useToAddressRequirements } from '../../hooks/useToAddressRequirements.js'
import { useWidgetEvents } from '../../hooks/useWidgetEvents.js'
import { useWidgetConfig } from '../../providers/WidgetProvider/WidgetProvider.js'
import { useSplitSubvariantStore } from '../../stores/settings/useSplitSubvariantStore.js'
import { WidgetEvent } from '../../types/events.js'
import { navigationRoutes } from '../../utils/navigationRoutes.js'

export const ReviewButton: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const emitter = useWidgetEvents()
  const { subvariant, subvariantOptions } = useWidgetConfig()
  const splitState = useSplitSubvariantStore((state) => state.state)
  const { toAddress, requiredToAddress } = useToAddressRequirements()
  const { routes, setReviewableRoute } = useRoutes()

  const currentRoute = routes?.[0]

  const { messages } = useMessageQueue(currentRoute)
  const priceImpactAcknowledged = useStorePriceImpactAcknowledged(
    (state) => (state as any).priceImpactAcknowledged
  )

  let hasMessages = messages.length > 0
  if (messages.length > 0) {
    const message: any = messages.find(
      (message) => message.id === 'PRICE_IMPACT_HIGH'
    )
    if (message && priceImpactAcknowledged) {
      hasMessages = false
    }
  }

  const handleClick = async () => {
    if (!currentRoute) {
      return
    }

    setReviewableRoute(currentRoute)
    navigate(navigationRoutes.transactionExecution, {
      state: { routeId: currentRoute.id },
    })
    emitter.emit(WidgetEvent.RouteSelected, {
      route: currentRoute,
      routes: routes!,
    })
  }

  const getButtonText = (): string => {
    if (currentRoute) {
      switch (subvariant) {
        case 'custom':
          return t(`button.${subvariantOptions?.custom ?? 'checkout'}Review`)
        case 'refuel':
          return t('button.getGas')
        default: {
          const transactionType =
            currentRoute.fromChainId === currentRoute.toChainId
              ? 'swap'
              : 'bridge'
          return t(`button.${transactionType}Review`)
        }
      }
    }
    switch (subvariant) {
      case 'custom':
        return subvariantOptions?.custom === 'deposit'
          ? t('button.deposit')
          : t('button.buy')
      case 'refuel':
        return t('button.getGas')
      case 'split':
        if (splitState) {
          return t(`button.${splitState}`)
        }
        return t('button.exchange')
      default:
        return t('button.exchange')
    }
  }

  return (
    <BaseTransactionButton
      text={getButtonText()}
      onClick={handleClick}
      disabled={
        hasMessages ||
        !currentRoute ||
        (currentRoute && requiredToAddress && !toAddress)
      }
    />
  )
}
