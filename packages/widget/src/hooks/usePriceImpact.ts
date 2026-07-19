import type { RouteExtended } from '@leapswap/widget-sdk'
import { getPriceImpact } from '../utils/getPriceImpact.js'

export const usePriceImpact = (route?: RouteExtended) => {
  let priceImpact = 0
  if (route) {
    priceImpact = getPriceImpact({
      fromAmount: BigInt(route?.fromAmount),
      toAmount: BigInt(route?.toAmount),
      fromToken: route?.fromToken,
      toToken: route?.toToken,
    })
  }

  return {
    priceImpact,
  }
}
