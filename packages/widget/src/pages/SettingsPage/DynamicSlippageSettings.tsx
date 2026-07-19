import { Box, styled, Switch, Typography, Tooltip } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../stores/settings/useSettings.js'
import { useSettingsActions } from '../../stores/settings/useSettingsActions.js'
import { Card } from '../../components/Card/Card.js'
import { CardRowContainer, CardTitleContainer, CardValue } from '../../components/Card/CardButton.style.js'
import { InfoOutlined } from '@mui/icons-material'

const StyledSwitch = styled(Switch)(({ theme }) => ({
  padding: 8,
  '& .MuiSwitch-track': {
    backgroundColor: '#666',
    opacity: 1,
    borderRadius: 20,
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: theme.palette.common.white,
  },
  '& .Mui-checked+.MuiSwitch-track': {
    backgroundColor: theme.palette.primary.main,
    opacity: 1,
  },
}))

export const DynamicSlippageSettings: React.FC = () => {
  const { t } = useTranslation()
  const { dynamicSlippage } = useSettings(['dynamicSlippage'])
  const { setValue } = useSettingsActions()

  const handleToggle = () => {
    setValue('dynamicSlippage', !dynamicSlippage)
  }

  return (
    <Card sx={{ p: 1, mb: 1 }}>
      <CardRowContainer sx={{ padding: '0 0 0 8px' }}>
        <CardTitleContainer>
          <CardValue>
            {t('translation:settings.dynamicMode', 'Dynamic Mode')}
            <Tooltip title={t('translation:settings.dynamicModeTooltip', 'Automatically minimizes slippage to enhance the MEV protection through running simulations.')}>
              <InfoOutlined fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle', fontSize: '16px', opacity: 0.7 }} />
            </Tooltip>
          </CardValue>
        </CardTitleContainer>
        <StyledSwitch
          checked={!!dynamicSlippage}
          onChange={handleToggle}
          name="dynamicSlippage"
          inputProps={{ 'aria-label': 'dynamic slippage toggle' }}
        />
      </CardRowContainer>
    </Card>
  )
} 