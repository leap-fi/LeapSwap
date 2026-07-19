import type { BoxProps } from '@mui/material'
import type { Route } from '@leapswap/widget-sdk'
import { WarningMessages } from '../../components/Messages/WarningMessages.js'

interface MainWarningMessagesProps extends BoxProps {
  route?: Route
}

export const MainWarningMessages: React.FC<MainWarningMessagesProps> = (
  props
) => {
  const currentRoute = props.route
  return <WarningMessages route={currentRoute} {...props} />
}
