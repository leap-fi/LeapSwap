import type { PropsWithChildren } from 'react'
import { Fragment } from 'react'
import {
  MemoryRouter,
  type MemoryRouterProps,
  useInRouterContext,
} from 'react-router-dom'
import { PageEntered } from './components/PageEntered.js'
import { IntegratorDataSourceSync } from './providers/IntegratorDataSourceSync.js'
import { I18nProvider } from './providers/I18nProvider/I18nProvider.js'
import { ThemeProvider } from './providers/ThemeProvider/ThemeProvider.js'
import { WalletProvider } from './providers/WalletProvider/WalletProvider.js'
import { NearProvider } from './providers/WalletProvider/NearProvider.js'
import { WidgetQueryClientProvider } from './providers/WidgetQueryClientProvider.js'
import {
  WidgetProvider,
  useWidgetConfig,
} from './providers/WidgetProvider/WidgetProvider.js'
import { StoreProvider } from './stores/StoreProvider.js'
import { URLSearchParamsBuilder } from './stores/form/URLSearchParamsBuilder.js'
import type { WidgetConfigProps } from './types/widget.js'

export const AppProvider: React.FC<PropsWithChildren<WidgetConfigProps>> = ({
  children,
  config,
  formRef,
}) => {
  return (
    <WidgetQueryClientProvider>
      <WidgetProvider config={config}>
        <IntegratorDataSourceSync />
        <I18nProvider>
          <ThemeProvider>
            <NearProvider>
              <WalletProvider>
                <StoreProvider config={config} formRef={formRef}>
                  <AppRouter>{children}</AppRouter>
                </StoreProvider>
              </WalletProvider>
            </NearProvider>
          </ThemeProvider>
        </I18nProvider>
      </WidgetProvider>
    </WidgetQueryClientProvider>
  )
}

const memoryRouterProps: MemoryRouterProps = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
}

export const AppRouter: React.FC<PropsWithChildren> = ({ children }) => {
  const { buildUrl } = useWidgetConfig()
  const inRouterContext = useInRouterContext()
  const Router = inRouterContext ? Fragment : MemoryRouter

  const routerProps = inRouterContext ? undefined : memoryRouterProps

  return (
    <Router {...routerProps}>
      {children}
      {buildUrl ? <URLSearchParamsBuilder /> : null}
      <PageEntered />
    </Router>
  )
}
