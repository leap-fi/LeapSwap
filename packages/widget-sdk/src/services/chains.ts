import type { ExtendedChain } from '@leapswap/widget-types'
import { config } from '../config.js'
import { SDKError } from '../errors/SDKError.js'
import { ValidationError } from '../errors/errors.js'
import { withDedupe } from '../utils/withDedupe.js'

export type ChainsProvider = () => Promise<ExtendedChain[]>

export const getChains = async (): Promise<ExtendedChain[]> => {
  const { chainsProvider, chains } = config.get()

  if (chainsProvider) {
    return withDedupe(() => chainsProvider(), { id: 'config.chainsProvider' })
  }

  if (chains.length) {
    return chains
  }

  throw new SDKError(
    new ValidationError(
      'Missing chains data. Pass chainsProvider (e.g. createLeapSwapChainsProvider from @leapswap/business-integrator) or a static chains array in createConfig().'
    )
  )
}
