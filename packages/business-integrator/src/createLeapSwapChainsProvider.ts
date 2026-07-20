import type { ExtendedChain } from '@leapswap/widget-types'
import {
  fetchLeapSwapChains,
  type FetchLeapSwapChainsConfig,
} from './fetchLeapSwapChains.js'

export type LeapSwapChainsProvider = () => Promise<ExtendedChain[]>

export interface LeapSwapChainsProviderConfig extends FetchLeapSwapChainsConfig {
  /** Fully replace chain loading (e.g. custom backend or static list). */
  getChains?: LeapSwapChainsProvider
}

export function createLeapSwapChainsProvider(
  config: LeapSwapChainsProviderConfig = {}
): LeapSwapChainsProvider {
  if (config.getChains) {
    return config.getChains
  }
  return () => fetchLeapSwapChains({ apiUrl: config.apiUrl })
}
