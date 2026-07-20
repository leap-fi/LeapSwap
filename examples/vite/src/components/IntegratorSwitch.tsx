import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import type { IntegratorMode } from '../integrator/types.js'

interface IntegratorSwitchProps {
  value: IntegratorMode
  onChange: (mode: IntegratorMode) => void
}

export function IntegratorSwitch({ value, onChange }: IntegratorSwitchProps) {
  return (
    <Box
      px={2}
      py={1.5}
      mb={2}
      display="flex"
      flexWrap="wrap"
      gap={2}
      alignItems="center"
      justifyContent="center"
      borderBottom="1px solid #EEE"
    >
      <Typography variant="body2" color="text.secondary">
        Data source
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        onChange={(_, next: IntegratorMode | null) => {
          if (next) {
            onChange(next)
          }
        }}
      >
        <ToggleButton value="openocean">OpenOcean</ToggleButton>
        <ToggleButton value="custom">Custom</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}
