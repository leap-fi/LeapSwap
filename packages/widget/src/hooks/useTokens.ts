import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useWidgetConfig } from '../providers/WidgetProvider/WidgetProvider.js'
import { LeapSwapService } from '../services/LeapSwapService.js'
import type { TokenAmount } from '../types/token.js'
import { useChains } from './useChains.js'

export const isNativeToken = (token: string) => {
  return [
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    '0x0000000000000000000000000000000000001010',
    '0x0000000000000000000000000000000000000000',
    '0x1',
    "bitcoin",
  ].indexOf(token.toLowerCase()) >= 0;
};

export const useTokens = (selectedChainId?: number) => {
  const { tokens: configTokens } = useWidgetConfig()
  const { data, isLoading } = useQuery({
    queryKey: ['tokens', selectedChainId],
    queryFn: async () => {
      if (!selectedChainId) {
        return { tokens: {} as Record<number, TokenAmount[]> }
      }
      const tokens = await LeapSwapService.getTokenList(
        selectedChainId.toString()
      )
      tokens.forEach((token: any) => {
        if (!(token as any).isNative) {
          (token as any).isNative = isNativeToken(token.address)
        }
      })
      return {
        tokens: {
          [selectedChainId]: tokens,
        },
      }
    },
    enabled: !!selectedChainId,
    refetchInterval: 3_600_000,
    staleTime: 3_600_000,
  })
  const {
    chains,
    isLoading: isSupportedChainsLoading,
    getChainById,
  } = useChains()

  const filteredData = useMemo(() => {
    if (isSupportedChainsLoading || !data) {
      return
    }
    const chain = getChainById(selectedChainId, chains)
    const chainAllowed = selectedChainId && chain
    if (!chainAllowed) {
      return
    }
    let filteredTokens = data.tokens?.[selectedChainId] || []
    const includedTokens = configTokens?.include?.filter(
      (token) => token.chainId === selectedChainId
    )
    if (includedTokens?.length) {
      filteredTokens = [...includedTokens, ...filteredTokens]
    }

    if (configTokens?.allow?.length || configTokens?.deny?.length) {
      const allowedTokensSet = new Set(
        configTokens?.allow
          ?.filter((token) => token.chainId === selectedChainId)
          .map((token) => token.address)
      )

      const deniedTokenAddressesSet = new Set(
        configTokens?.deny
          ?.filter((token) => token.chainId === selectedChainId)
          .map((token) => token.address)
      )

      if (allowedTokensSet.size || deniedTokenAddressesSet.size) {
        filteredTokens = filteredTokens.filter(
          (token: any) =>
            (!allowedTokensSet.size || allowedTokensSet.has(token.address)) &&
            !deniedTokenAddressesSet.has(token.address)
        )
      }
    }
    const filteredTokensMap = new Map(
      filteredTokens.map((token: any) => [token.address, token])
    )

    const [popularTokens, featuredTokens] = (
      ['popular', 'featured'] as ('popular' | 'featured')[]
    ).map((tokenType) => {
      const typedConfigTokens = configTokens?.[tokenType]?.filter(
        (token) => token.chainId === selectedChainId
      )

      const populatedConfigTokens = typedConfigTokens?.map((token) => {
        // Mark token as popular
        (token as any)[tokenType] = true
        // Check if this token exists in the filteredTokensMap and add priceUSD if it does
        const matchingFilteredToken = filteredTokensMap.get(token.address)
        if ((matchingFilteredToken as any)?.priceUSD) {
          (token as any).priceUSD = (matchingFilteredToken as any).priceUSD
        }
        if (!token.logoURI && matchingFilteredToken) {
          (token as any).logoURI = (matchingFilteredToken as any).logoURI
        }
        return token as TokenAmount
      })

      if (populatedConfigTokens?.length) {
        const configTokenAddresses = new Set(
          populatedConfigTokens?.map((token: any) => token.address)
        )
        filteredTokens = filteredTokens.filter(
          (token: any) => !configTokenAddresses.has(token.address)
        )
        populatedConfigTokens.push(...filteredTokens)
        filteredTokens = populatedConfigTokens
      }

      return populatedConfigTokens
    })

    return {
      tokens: filteredTokens,
      featuredTokens,
      popularTokens,
      chain,
    }
  }, [
    chains,
    configTokens,
    data,
    getChainById,
    isSupportedChainsLoading,
    selectedChainId,
  ])

  return {
    tokens: filteredData?.tokens,
    featuredTokens: filteredData?.featuredTokens,
    popularTokens: filteredData?.popularTokens,
    chain: filteredData?.chain,
    isLoading,
  }
}
