import './polyfills'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { WalletProvider } from './providers/WalletProvider'

const queryClient = new QueryClient()

document.body.style.margin = '0'
document.body.style.background = '#0b1215'
document.body.style.color = '#ffffff'
document.body.style.minHeight = '100vh'
document.body.style.fontFamily = 'Inter, system-ui, sans-serif'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <App />
      </WalletProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
