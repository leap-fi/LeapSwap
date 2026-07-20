import type { ExtendedChain } from '@leapswap/widget-types'
import { fetchOpenOceanChains } from './fetchOpenOceanChains.js'

export type OpenOceanChainsProvider = () => Promise<ExtendedChain[]>

export interface OpenOceanChainsProviderConfig {
  /** Replace default OpenOcean chain list (e.g. your own backend or static list). */
  getChains?: OpenOceanChainsProvider
}

export function createOpenOceanChainsProvider(
  config: OpenOceanChainsProviderConfig = {}
): OpenOceanChainsProvider {
  if (config.getChains) {
    return config.getChains
  }
  return () => fetchOpenOceanChains()
}
