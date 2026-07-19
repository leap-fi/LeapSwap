import { WarningRounded } from '@mui/icons-material'
import {
  type BoxProps,
  Checkbox,
  FormControlLabel,
  Typography,
} from '@mui/material'
import { AlertMessage } from './AlertMessage.js'
import { useStorePriceImpactAcknowledged } from './useMessageQueue.js'
interface PriceImpactHighMessageProps extends BoxProps {
  onAcknowledge?: (acknowledged: boolean) => void
}

export const PriceImpactHighMessage: React.FC<PriceImpactHighMessageProps> = ({
  onAcknowledge,
  ...props
}) => {
  const acknowledged = useStorePriceImpactAcknowledged(
    (state) => (state as any).priceImpactAcknowledged
  )
  const setAcknowledged = useStorePriceImpactAcknowledged(
    (state) => (state as any).setPriceImpactAcknowledged
  )

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked
    setAcknowledged(newValue)
    onAcknowledge?.(newValue)
  }

  return (
    <AlertMessage
      severity="warning"
      icon={<WarningRounded />}
      title={
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          Price impact is too high
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
        I acknowledge the risk and confirm to continue the trade despite loss of
        funds
      </Typography>
      <FormControlLabel
        control={<Checkbox checked={acknowledged} onChange={handleChange} />}
        label="I understand and accept the risk"
        sx={{ alignItems: 'center', px: 2, pt: 1 }}
      />
    </AlertMessage>
  )
}
