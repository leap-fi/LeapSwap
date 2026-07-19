import { useMemo } from 'react'
import { useTokenSearch } from './useTokenSearch.js'
import { useTokens } from './useTokens.js'
import { useTokenPrice } from './useTokenPrice.js'
import type { TokenAmount } from '../types/token.js'

export const useToken = (chainId?: number, tokenAddress?: string) => {
  const { tokens, isLoading } = useTokens(chainId)
  const token = useMemo(() => {
    const token = tokens?.find(
      (token: TokenAmount) => token.address === tokenAddress && token.chainId === chainId
    )
    return token
  }, [chainId, tokenAddress, tokens])

  const tokenSearchEnabled = !isLoading && !token
  const { token: searchedToken, isLoading: isSearchedTokenLoading } =
    useTokenSearch(chainId, tokenAddress, tokenSearchEnabled)

  // Get token price
  const { price: latestPrice, isLoading: isPriceLoading } = useTokenPrice(chainId, token || searchedToken)

  // Update token price
  const updatedToken = useMemo(() => {
    if (!latestPrice || (!token && !searchedToken)) {
      return token || searchedToken
    }
    return {
      ...(token || searchedToken),
      priceUSD: latestPrice
    }
  }, [token, searchedToken, latestPrice])

  return {
    token: updatedToken,
    isLoading: isLoading || (tokenSearchEnabled && isSearchedTokenLoading) || isPriceLoading,
  }
}
