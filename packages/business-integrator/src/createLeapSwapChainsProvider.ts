import type { ExtendedChain } from '@leapswap/widget-types'
import { fetchLeapSwapChains } from './fetchLeapSwapChains.js'

export type LeapSwapChainsProvider = () => Promise<ExtendedChain[]>

export interface LeapSwapChainsProviderConfig {
  /** Replace default OpenOcean chain list (e.g. your own backend or static list). */
  getChains?: LeapSwapChainsProvider
}

export function createLeapSwapChainsProvider(
  config: LeapSwapChainsProviderConfig = {}
): LeapSwapChainsProvider {
  if (config.getChains) {
    return config.getChains
  }
  return () => fetchLeapSwapChains()
}
