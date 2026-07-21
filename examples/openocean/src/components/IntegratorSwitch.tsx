import { Box, Button, Tooltip, Typography } from '@mui/material'
import type { IntegratorMode } from '../integrator/types.js'
import type { ExampleChrome } from '../theme.js'

interface IntegratorSwitchProps {
  value: IntegratorMode
  chrome: ExampleChrome
  onChange: (mode: IntegratorMode) => void
}

const options: {
  value: IntegratorMode
  label: string
  tip: string
}[] = [
  {
    value: 'openocean',
    label: 'OpenOcean',
    tip: 'Use @leapswap/business-integrator (OpenOcean API reference)',
  },
  {
    value: 'custom',
    label: 'Custom',
    tip: 'Use local src/integrator stub — replace with your own DEX / aggregator',
  },
]

export function IntegratorSwitch({
  value,
  chrome,
  onChange,
}: IntegratorSwitchProps) {
  return (
    <Box display="flex" flexDirection="column" gap={1.25}>
      <Typography
        variant="subtitle2"
        fontWeight={600}
        sx={{ color: chrome.text, fontSize: 14 }}
      >
        Data source
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {options.map((option) => {
          const selected = value === option.value
          return (
            <Tooltip key={option.value} title={option.tip} arrow placement="bottom">
              <Button
                size="small"
                disableElevation
                onClick={() => onChange(option.value)}
                sx={{
                  minWidth: 'unset',
                  width: 'fit-content',
                  px: 1.5,
                  py: 0.75,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  borderRadius: chrome.radiusSm,
                  border: `1px solid ${selected ? chrome.primary : chrome.border}`,
                  bgcolor: selected ? chrome.primary : 'transparent',
                  color: selected ? '#fff' : chrome.textSecondary,
                  '&:hover': {
                    bgcolor: selected ? chrome.primaryDark : chrome.primaryHoverBg,
                    borderColor: selected ? chrome.primaryDark : chrome.border,
                  },
                }}
              >
                {option.label}
              </Button>
            </Tooltip>
          )
        })}
      </Box>
    </Box>
  )
}
