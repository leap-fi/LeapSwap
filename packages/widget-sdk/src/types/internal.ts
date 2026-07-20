import type {
  ChainId,
  ExtendedChain,
  RouteOptions,
} from '@leapswap/widget-types'
import type { SDKProvider } from '../core/types.js'
import type { ChainsProvider } from '../services/chains.js'

export type { ChainsProvider } from '../services/chains.js'

export interface SDKBaseConfig {
  apiKey?: string
  apiUrl: string
  integrator: string
  userId?: string
  providers: SDKProvider[]
  routeOptions?: RouteOptions
  rpcUrls: RPCUrls
  chains: ExtendedChain[]
  chainsProvider?: ChainsProvider
  integratorDataKey?: string
  disableVersionCheck?: boolean
  widgetVersion?: string
  preloadChains: boolean
  debug: boolean
}

export interface SDKConfig extends Partial<Omit<SDKBaseConfig, 'integrator'>> {
  integrator: string
}

export type RPCUrls = Partial<Record<ChainId, string[]>>
