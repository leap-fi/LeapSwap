import { WarningRounded } from '@mui/icons-material'
import { type BoxProps, Typography } from '@mui/material'
import { useAvailableChains } from '../../hooks/useAvailableChains.js'
import { formatServerErrorMessage } from '../../utils/formatServerErrorMessage.js'
import { AlertMessage } from './AlertMessage.js'

interface ServerErrorMessageProps extends BoxProps {
  errorMsg?: string
}

export const ServerErrorMessage: React.FC<ServerErrorMessageProps> = ({
  errorMsg,
  ...props
}) => {
  const { getChainById } = useAvailableChains()
  const formattedErrorMsg = formatServerErrorMessage(errorMsg, getChainById)

  return (
    <AlertMessage
      severity="warning"
      icon={<WarningRounded />}
      title={
        <Typography
          variant="body2"
          sx={{
            color: 'text.primary',
          }}
        >
          {formattedErrorMsg}
        </Typography>
      }
      multiline
      {...props}
    />
  )
}
