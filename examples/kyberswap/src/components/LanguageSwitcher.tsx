import { Box, Button, ButtonGroup, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { hostLocales, type HostLocale } from '../i18n'

const chrome = {
  primary: '#31CB9E',
  primaryHoverBg: 'rgba(49, 203, 158, 0.12)',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#ffffff',
  textSecondary: '#9aa3b2',
  radiusSm: '12px',
}

const labels: Record<HostLocale, string> = {
  en: 'EN',
  zh: '中文',
}

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const current = (i18n.resolvedLanguage || i18n.language || 'en')
    .split('-')[0]
    .toLowerCase() as HostLocale

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <Typography fontSize={12} sx={{ color: chrome.textSecondary }}>
        {t('app.language')}
      </Typography>
      <ButtonGroup size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
        {hostLocales.map((code) => {
          const selected = current === code
          return (
            <Button
              key={code}
              onClick={() => void i18n.changeLanguage(code)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: chrome.border,
                color: selected ? chrome.primary : chrome.text,
                bgcolor: selected ? chrome.primaryHoverBg : 'transparent',
                '&:hover': {
                  borderColor: chrome.primary,
                  bgcolor: chrome.primaryHoverBg,
                },
              }}
            >
              {labels[code]}
            </Button>
          )
        })}
      </ButtonGroup>
    </Box>
  )
}
