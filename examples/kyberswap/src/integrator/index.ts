import { chainsProvider } from './chainsProvider.js'
import { createKyberSwapDataProvider } from './createKyberSwapDataProvider.js'

export const swapDataProvider = createKyberSwapDataProvider()

export const kyberSwapIntegrator = {
  swapDataProvider,
  chainsProvider,
}

export { chainsProvider, createKyberSwapDataProvider }
