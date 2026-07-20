import { customIntegrator } from './custom.js'
import { openOceanIntegrator } from './openOcean.js'
import type { IntegratorBundle, IntegratorMode } from './types.js'

export function getIntegrator(mode: IntegratorMode): IntegratorBundle {
  return mode === 'openocean' ? openOceanIntegrator : customIntegrator
}
