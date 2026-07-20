import { useQuery } from '@tanstack/react-query'
import { useSwapDataProvider } from './useSwapDataProvider.js'
import { useIntegratorCacheKey } from './useIntegratorCacheKey.js'
import { useSettings } from '../stores/settings/useSettings.js'

const gasKey: any = {
  slow: 'standard',
  normal: 'instant',
  fast: 'fast',
}
export const useGasPrice = (chainName: string) => {
  const { gasPrice } = useSettings(['gasPrice'])
  const swapDataProvider = useSwapDataProvider()
  const integratorCacheKey = useIntegratorCacheKey()
  const { data, isLoading } = useQuery({
    queryKey: ['gasPrice', integratorCacheKey, chainName, swapDataProvider],
    queryFn: () => swapDataProvider.getGasPrice(chainName.toLowerCase()),
  })
  const _gasPrice = data?.[gasKey[gasPrice || 'normal']]
  return {
    gasPrice: _gasPrice || _gasPrice?.maxFeePerGas || data?.gasPrice || 50000000,
    isLoading,
  }
}
