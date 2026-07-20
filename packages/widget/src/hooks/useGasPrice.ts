import { useQuery } from '@tanstack/react-query'
import { useSwapDataProvider } from './useSwapDataProvider.js'
import { useIntegratorCacheKey } from './useIntegratorCacheKey.js'
import { useSettings } from '../stores/settings/useSettings.js'

const gasKey = {
  slow: 'standard',
  normal: 'instant',
  fast: 'fast',
} as const

export const useGasPrice = (chainId: string) => {
  const { gasPrice: gasSetting } = useSettings(['gasPrice'])
  const swapDataProvider = useSwapDataProvider()
  const integratorCacheKey = useIntegratorCacheKey()
  const { data, isLoading } = useQuery({
    queryKey: ['gasPrice', integratorCacheKey, chainId, swapDataProvider],
    queryFn: () => swapDataProvider.getGasPrice(chainId),
    enabled: Boolean(chainId),
  })

  const tierKey = gasKey[(gasSetting as keyof typeof gasKey) || 'normal']
  const tierValue = data?.[tierKey]
  const resolved =
    (typeof tierValue === 'string' && tierValue) ||
    data?.gasPrice ||
    '50000000'

  return {
    gasPrice: resolved,
    isLoading,
  }
}
