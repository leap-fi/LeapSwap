import { BaseTransactionButton } from '../../components/BaseTransactionButton/BaseTransactionButton.js'
import {
  useMessageQueue,
  useStorePriceImpactAcknowledged,
} from '../../components/Messages/useMessageQueue.js'
import type { StartTransactionButtonProps } from './types.js'

export const StartTransactionButton: React.FC<StartTransactionButtonProps> = ({
  onClick,
  route,
  text,
  loading,
}) => {
  const { messages, isLoading } = useMessageQueue(route)
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
  return (
    <BaseTransactionButton
      onClick={onClick}
      text={text}
      disabled={hasMessages}
      loading={isLoading || loading}
    />
  )
}
