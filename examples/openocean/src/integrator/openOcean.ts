import {
  createOpenOceanChainsProvider,
  createOpenOceanDataProvider,
} from '@leapswap/business-integrator'
import type { IntegratorBundle } from './types.js'

/** Default: @leapswap/business-integrator (OpenOcean reference). */
export const openOceanIntegrator: IntegratorBundle = {
  swapDataProvider: createOpenOceanDataProvider(),
  chainsProvider: createOpenOceanChainsProvider(),
}
