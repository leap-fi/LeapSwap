import type { ChainsProvider } from '@leapswap/widget-sdk'
import type { SwapDataProvider } from '@leapswap/widget'

export type IntegratorMode = 'openocean' | 'custom'

export interface IntegratorBundle {
  swapDataProvider: SwapDataProvider
  chainsProvider: ChainsProvider
}
