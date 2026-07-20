import {
  QueryClientProvider,
  QueryClientContext,
} from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { useContext } from 'react'
import { queryClient as widgetQueryClient } from '../config/queryClient.js'

/** Reuse parent QueryClient when the host app already provides one. */
export function WidgetQueryClientProvider({ children }: PropsWithChildren) {
  const parentClient = useContext(QueryClientContext)

  if (parentClient) {
    return children
  }

  return (
    <QueryClientProvider client={widgetQueryClient}>
      {children}
    </QueryClientProvider>
  )
}
