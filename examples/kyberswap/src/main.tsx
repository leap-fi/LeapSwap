import './polyfills'
import './i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { App } from './App'
import i18n from './i18n'
import { WalletProvider } from './providers/WalletProvider'

const queryClient = new QueryClient()

document.body.style.margin = '0'
document.body.style.background = '#0b1215'
document.body.style.color = '#ffffff'
document.body.style.minHeight = '100vh'
document.body.style.fontFamily = 'Inter, system-ui, sans-serif'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <App />
        </WalletProvider>
      </QueryClientProvider>
    </I18nextProvider>
  </React.StrictMode>
)
