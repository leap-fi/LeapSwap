import type { SwapDataProvider } from '@leapswap/widget'

/**
 * Service layer: implement your DEX / aggregator HTTP calls here.
 * Method signatures mirror {@link SwapDataProvider} — Widget hooks call these directly.
 */
export type SwapIntegratorService = SwapDataProvider

/** Wire a service instance into the Widget `swapDataProvider` prop. */
export function createSwapDataProvider(
  service: SwapIntegratorService
): SwapDataProvider {
  return {
    getQuote: (params) => service.getQuote(params),
    getSwapQuote: (params) => service.getSwapQuote(params),
    getTokenList: (chain) => service.getTokenList(chain),
    getDexList: (chain) => service.getDexList(chain),
    getGasPrice: (chain) => service.getGasPrice(chain),
    getTokenInfo: (chain, tokenAddress) =>
      service.getTokenInfo(chain, tokenAddress),
    getTokensPrice: (chain, tokenAddresses) =>
      service.getTokensPrice(chain, tokenAddresses),
    getRpcUrl: () => service.getRpcUrl(),
  }
}
