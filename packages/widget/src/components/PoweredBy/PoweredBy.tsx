import { Box, Tooltip, Typography } from '@mui/material'
import { version } from '../../config/version.js'
import { useWidgetConfig } from '../../providers/WidgetProvider/WidgetProvider.js'
import type { PoweredByBranding, PoweredByType } from '../../types/widget.js'
import { Link } from './PoweredBy.style.js'

const poweredByPresets: Record<
  PoweredByType,
  Required<Pick<PoweredByBranding, 'name' | 'url' | 'prefix'>>
> = {
  default: {
    url: 'https://github.com/leap-fi/LeapSwap',
    name: 'LeapSwap',
    prefix: 'Powered by',
  },
  jumper: {
    url: 'https://jumper.exchange',
    name: 'Jumper',
    prefix: 'Powered by',
  },
}

const isPoweredByBranding = (
  value: PoweredByType | PoweredByBranding
): value is PoweredByBranding =>
  typeof value === 'object' && value !== null && 'name' in value && 'url' in value

const resolvePoweredByBranding = (
  poweredBy: PoweredByType | PoweredByBranding = 'default'
): Required<Pick<PoweredByBranding, 'name' | 'url' | 'prefix'>> => {
  if (isPoweredByBranding(poweredBy)) {
    return {
      prefix: poweredBy.prefix ?? 'Powered by',
      name: poweredBy.name,
      url: poweredBy.url,
    }
  }
  return poweredByPresets[poweredBy]
}

export const PoweredBy: React.FC = () => {
  const { poweredBy = 'default' } = useWidgetConfig()
  const branding = resolvePoweredByBranding(poweredBy)

  return (
    <Box
      sx={{
        pt: 1,
        pb: 2,
        flex: 1,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <Tooltip title={`v${version}`} enterDelay={1000}>
        <Link
          href={branding.url}
          target="_blank"
          underline="none"
          color="text.primary"
        >
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: 12,
              fontWeight: 500,
              px: 0.5,
            }}
          >
            {branding.prefix}
          </Typography>
          <Typography
            sx={{
              color: 'text.primary',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {branding.name}
          </Typography>
        </Link>
      </Tooltip>
    </Box>
  )
}
