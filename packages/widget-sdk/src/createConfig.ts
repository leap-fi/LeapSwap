import { config } from './config.js'
import { getChains } from './services/api.js'
import type { SDKConfig } from './types/internal.js'
import { checkPackageUpdates } from './utils/checkPackageUpdates.js'
import { name, version } from './version.js'

function createBaseConfig(options: SDKConfig) {
  if (!options.integrator) {
    throw new Error(
      'Integrator not found. Please see documentation https://leapswap.finance/api'
    )
  }
  const _config = config.set(options)
  if (!options.disableVersionCheck && process.env.NODE_ENV === 'development') {
    checkPackageUpdates(name, version)
  }
  return _config
}

export async function createChainsConfig() {
  config.loading = getChains()
    .then((chains) => config.setChains(chains))
    .catch()
  await config.loading
}

export function createConfig(options: SDKConfig) {
  const _config = createBaseConfig(options)
  if (_config.preloadChains) {
    createChainsConfig()
  }
  return _config
}
