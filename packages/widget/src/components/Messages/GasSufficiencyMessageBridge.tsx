import { type BoxProps, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { AlertMessage } from './AlertMessage.js'
import { Warning as WarningIcon } from '@mui/icons-material'

interface GasSufficiencyMessageProps extends BoxProps {
  // insufficientGas?: GasSufficiency[]
}

export const GasSufficiencyMessageBridge: React.FC<
  GasSufficiencyMessageProps
> = ({ ...props }) => {
  const { t } = useTranslation()
  return (
    <AlertMessage
      icon={<WarningIcon />}
      severity="warning"
      title={
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
          }}
        >
          Not enough balance
        </Typography>
      }
      {...props}
    >
      <Typography
        variant="body2"
        sx={{
          px: 2,
          pt: 1,
        }}
      >
        Included gas is paid on top of the amount and covers solvers gas costs
        to fulfill your trade
      </Typography>
    </AlertMessage>
  )
}
