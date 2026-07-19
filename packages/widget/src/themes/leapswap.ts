import { tabsClasses } from '@mui/material'
import type { WidgetTheme } from '../types/widget.js'

export const leapSwapTheme: WidgetTheme = {
  palette: {
    primary: {
      main: '#fb534f',
    },
    secondary: {
      main: '#FFC800',
    },
    background: {
      default: '#222037',
      paper: '#29273D',
    },
    text: {
      primary: '#ffffff',
      secondary: '#8C7F8C',
    },
    grey: {
      200: '#EEEFF2',
      300: '#D5DAE1',
      700: '#555B62',
      800: '#373F48',
    },
  },
  shape: {
    borderRadius: 12,
    borderRadiusSecondary: 12,
    borderRadiusTertiary: 24,
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
  container: {
    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.08)',
    borderRadius: '16px',
  },
  playground: {
    background: '#17122B',
  },
  components: {
    MuiCard: {
      defaultProps: { variant: 'filled' },
    },
    // Used only for 'split' subvariant and can be safely removed if not used
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: '#29273D',
          [`.${tabsClasses.indicator}`]: {
            backgroundColor: '#17122b',
          },
        },
      },
    },
  },
}
