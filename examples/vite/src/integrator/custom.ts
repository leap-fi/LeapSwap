import { chainsProvider as customChainsProvider } from './chainsProvider.js'
import { swapDataProvider as customSwapDataProvider } from './swapDataProvider.js'
import type { IntegratorBundle } from './types.js'

/** Placeholder: your own DEX / aggregator in src/integrator/*.ts */
export const customIntegrator: IntegratorBundle = {
  swapDataProvider: customSwapDataProvider,
  chainsProvider: customChainsProvider,
}
