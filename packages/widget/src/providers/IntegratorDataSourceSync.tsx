import { config, createChainsConfig } from '@leapswap/widget-sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useWidgetConfig } from './WidgetProvider/WidgetProvider.js'

const INTEGRATOR_QUERY_KEYS = [
  'chains',
  'tokens',
  'routes',
  'gasPrice',
  'token-price',
  'token-search',
] as const

/**
 * Clears integrator-scoped React Query cache and reloads chains when
 * swap/chains providers or dataSourceKey change.
 */
export function IntegratorDataSourceSync() {
  const queryClient = useQueryClient()
  const { chainsProvider, swapDataProvider, dataSourceKey, formUpdateKey } =
    useWidgetConfig()
  const cacheKey = dataSourceKey ?? formUpdateKey

  useEffect(() => {
    for (const key of INTEGRATOR_QUERY_KEYS) {
      queryClient.removeQueries({ queryKey: [key], exact: false })
    }

    if (chainsProvider) {
      config.set({
        ...config.get(),
        chainsProvider,
        integratorDataKey: cacheKey,
        chains: [],
      })
      void createChainsConfig()
    }
  }, [cacheKey, chainsProvider, swapDataProvider, queryClient])

  return null
}
