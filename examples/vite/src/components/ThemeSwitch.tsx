import { Box, Button, Tooltip, Typography } from '@mui/material'
import type { ExampleChrome, ThemeId } from '../theme.js'
import { themePresetList } from '../theme.js'

interface ThemeSwitchProps {
  value: ThemeId
  chrome: ExampleChrome
  onChange: (themeId: ThemeId) => void
}

export function ThemeSwitch({ value, chrome, onChange }: ThemeSwitchProps) {
  return (
    <Box display="flex" flexDirection="column" gap={1.25}>
      <Typography
        variant="subtitle2"
        fontWeight={600}
        sx={{ color: chrome.text, fontSize: 14 }}
      >
        Theme
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {themePresetList.map((preset) => {
          const selected = value === preset.id
          return (
            <Tooltip key={preset.id} title={preset.tip} arrow placement="bottom">
              <Button
                size="small"
                disableElevation
                onClick={() => onChange(preset.id)}
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
                {preset.label}
              </Button>
            </Tooltip>
          )
        })}
      </Box>
    </Box>
  )
}
