import type { BoxProps } from '@mui/material'
import { Collapse } from '@mui/material'
import type { Route } from '@leapswap/widget-sdk'
import { AccountNotDeployedMessage } from './AccountNotDeployedMessage.js'
import { FundsSufficiencyMessage } from './FundsSufficiencyMessage.js'
import { GasSufficiencyMessage } from './GasSufficiencyMessage.js'
import { GasSufficiencyMessageBridge } from './GasSufficiencyMessageBridge.js'
import { PriceImpactHighMessage } from './PriceImpactHighMessage.js'
import { ServerErrorMessage } from './ServeErrorMessage.js'
import { ToAddressRequiredMessage } from './ToAddressRequiredMessage.js'
import {
  useMessageQueue,
  useStorePriceImpactAcknowledged,
} from './useMessageQueue.js'

type WarningMessagesProps = BoxProps & {
  route?: Route
  allowInteraction?: boolean
}

export const WarningMessages: React.FC<WarningMessagesProps> = ({
  route,
  allowInteraction,
  ...props
}) => {
  const { messages, hasMessages } = useMessageQueue(route, allowInteraction)
  const setPriceImpactAcknowledged = useStorePriceImpactAcknowledged(
    (state) => (state as any).setPriceImpactAcknowledged
  )
  const getMessage = () => {
    switch (messages[0]?.id) {
      case 'INSUFFICIENT_FUNDS':
        return <FundsSufficiencyMessage {...props} />
      case 'INSUFFICIENT_GAS':
        return (
          <GasSufficiencyMessage
            insufficientGas={messages[0].props?.insufficientGas}
            {...props}
          />
        )
      case 'INSUFFICIENT_BRIDGE':
        return <GasSufficiencyMessageBridge {...props} />
      case 'ACCOUNT_NOT_DEPLOYED':
        return <AccountNotDeployedMessage {...props} />
      case 'PRICE_IMPACT_HIGH':
        return (
          <PriceImpactHighMessage
            onAcknowledge={(e) => {
              setPriceImpactAcknowledged(e)
            }}
            {...props}
          />
        )
      case 'TO_ADDRESS_REQUIRED':
        // return <ToAddressRequiredMessage {...props} />
        const fromChainId = route?.fromChainId
        const toChainId = route?.toChainId
        if (fromChainId && toChainId && fromChainId !== toChainId) {
          return <ToAddressRequiredMessage {...props} />
        }
        return null
      case 'SERVER_ERROR':
        return (
          <ServerErrorMessage
            errorMsg={messages[0].props?.errorMsg}
            {...props}
          />
        )
      default:
        return null
    }
  }

  return (
    <Collapse in={hasMessages} timeout={225} unmountOnExit mountOnEnter>
      {getMessage()}
    </Collapse>
  )
}
