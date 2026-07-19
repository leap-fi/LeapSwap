import type { Token } from '@leapswap/widget-sdk'
import { formatTokenPrice } from './format.js'

interface GetPriceImpractProps {
  fromToken: Token
  toToken: Token
  fromAmount?: bigint
  toAmount?: bigint
}

export const getPriceImpact = ({
  fromToken,
  toToken,
  fromAmount,
  toAmount,
}: GetPriceImpractProps) => {
  const fromTokenPrice = formatTokenPrice(
    fromAmount,
    fromToken.priceUSD,
    fromToken.decimals
  )
  const toTokenPrice = formatTokenPrice(
    toAmount,
    toToken.priceUSD,
    toToken.decimals
  )

  if (!fromTokenPrice || !toTokenPrice) {
    return 0
  }
  // console.log('fromTokenPrice', fromTokenPrice)
  // console.log('toTokenPrice', toTokenPrice)
  // console.log('fromTokenPrice / toTokenPrice', fromTokenPrice / toTokenPrice)
  const priceImpact = toTokenPrice / fromTokenPrice - 1

  return priceImpact
}
