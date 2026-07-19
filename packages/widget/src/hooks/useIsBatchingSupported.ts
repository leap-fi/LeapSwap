import { ChainType, isBatchingSupported } from '@leapswap/widget-sdk'
import type { ExtendedChain } from '@leapswap/widget-sdk'
import { useQuery } from '@tanstack/react-query'

export function useIsBatchingSupported(
  chain?: ExtendedChain,
  address?: string
) {
  const enabled = chain && chain.chainType === ChainType.EVM && !!address
  const { data, isLoading } = useQuery({
    queryKey: ['isBatchingSupported', chain?.id, address],
    queryFn: () => {
      return isBatchingSupported({ chainId: chain!.id })
    },
    enabled,
    staleTime: 3_600_000,
    retry: false,
  })

  return {
    isBatchingSupported: data,
    isBatchingSupportedLoading: enabled && isLoading,
  }
}
