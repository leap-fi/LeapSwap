import { useQuery } from '@tanstack/react-query'
import { useSwapDataProvider } from './useSwapDataProvider.js'
import type { TokenAmount } from '../types/token.js'

export const useTokenPrice = (chainId?: number, token?: TokenAmount) => {
  const swapDataProvider = useSwapDataProvider()
  const { data: price, isLoading } = useQuery({
    queryKey: ['token-price', chainId, token?.address],
    queryFn: async () => {
      if (!chainId || !token?.address) {
        return undefined
      }
      const prices = await swapDataProvider.getTokensPrice(chainId.toString(), [
        token.address,
      ])
      return prices[token.address.toLowerCase()] || 0
    },
    enabled: !!chainId && !!token?.address,
    refetchInterval: 60_000, // Update price every minute
    staleTime: 60_000,
  })

  return {
    price,
    isLoading,
  }
}
