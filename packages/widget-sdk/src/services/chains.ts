import type { ExtendedChain } from '@leapswap/widget-types'
import { config } from '../config.js'
import { SDKError } from '../errors/SDKError.js'
import { ValidationError } from '../errors/errors.js'
import { withDedupe } from '../utils/withDedupe.js'

export type ChainsProvider = () => Promise<ExtendedChain[]>

export const getChains = async (): Promise<ExtendedChain[]> => {
  const { chainsProvider, chains, integratorDataKey, integrator } = config.get()

  if (chainsProvider) {
    return withDedupe(() => chainsProvider(), {
      id: `chains:${integrator}:${integratorDataKey ?? 'default'}`,
    })
  }

  if (chains.length) {
    return chains
  }

  throw new SDKError(
    new ValidationError(
      'Missing chains data. Pass chainsProvider from your integrator or a static chains array in createConfig().'
    )
  )
}
