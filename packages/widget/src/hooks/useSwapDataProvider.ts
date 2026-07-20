import { useWidgetConfig } from '../providers/WidgetProvider/WidgetProvider.js'
import type { SwapDataProvider } from '../types/swapDataProvider.js'

const SWAP_DATA_PROVIDER_ERROR =
  'WidgetConfig.swapDataProvider is required. Implement SwapDataProvider in your integrator package and pass it via swapDataProvider.'

export function useSwapDataProvider(): SwapDataProvider {
  const { swapDataProvider } = useWidgetConfig()
  if (!swapDataProvider) {
    throw new Error(SWAP_DATA_PROVIDER_ERROR)
  }
  return swapDataProvider
}
