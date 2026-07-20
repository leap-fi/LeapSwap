import './polyfills'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { WalletProvider } from './providers/WalletProvider'
import { defaultThemeId, getThemePreset } from './theme'

const queryClient = new QueryClient()
const initialChrome = getThemePreset(defaultThemeId).chrome

document.body.style.margin = '0'
document.body.style.background = initialChrome.pageBg
document.body.style.color = initialChrome.text
document.body.style.minHeight = '100vh'
document.body.style.fontFamily = 'Inter, system-ui, sans-serif'
document.body.style.transition = 'background-color 0.2s ease, color 0.2s ease'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <App />
      </WalletProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
