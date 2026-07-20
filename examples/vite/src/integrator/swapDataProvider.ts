import type { SwapDataProvider } from '@leapswap/widget'
import { createSwapDataProvider } from './createSwapDataProvider.js'

const NOT_IMPLEMENTED =
  'Implement swapDataProvider in src/integrator/ — connect your DEX or aggregator API.'

function notImplemented(): never {
  throw new Error(NOT_IMPLEMENTED)
}

/** Replace this object with your DEX / aggregator service. */
const stubService: SwapDataProvider = {
  getQuote: notImplemented,
  getSwapQuote: notImplemented,
  getTokenList: async () => [],
  getDexList: async () => ({}),
  getGasPrice: async () => ({ data: { gasPrice: '0' } }),
  getTokenInfo: notImplemented,
  getTokensPrice: async () => ({}),
  getRpcUrl: async () => '',
}

export const swapDataProvider = createSwapDataProvider(stubService)
