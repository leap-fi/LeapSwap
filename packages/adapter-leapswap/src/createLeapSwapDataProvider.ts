import {
  LeapSwapService,
  type LeapSwapServiceConfig,
} from './LeapSwapService.js'

export type LeapSwapDataProviderConfig = LeapSwapServiceConfig

export function createLeapSwapDataProvider(
  config: LeapSwapDataProviderConfig = {}
) {
  const service = new LeapSwapService(config)

  return {
    getQuote: service.getQuote.bind(service),
    getSwapQuote: service.getSwapQuote.bind(service),
    getTokenList: service.getTokenList.bind(service),
    getDexList: service.getDexList.bind(service),
    getGasPrice: service.getGasPrice.bind(service),
    getTokenInfo: service.getTokenInfo.bind(service),
    getTokensPrice: service.getTokensPrice.bind(service),
    getRpcUrl: service.getRpcUrl.bind(service),
  }
}

export type LeapSwapDataProvider = ReturnType<
  typeof createLeapSwapDataProvider
>
