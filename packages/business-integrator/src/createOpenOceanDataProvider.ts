import {
  OpenOceanSwapService,
  type OpenOceanSwapServiceConfig,
} from './OpenOceanSwapService.js'

export type OpenOceanDataProviderConfig = OpenOceanSwapServiceConfig

export function createOpenOceanDataProvider(
  config: OpenOceanDataProviderConfig = {}
) {
  const service = new OpenOceanSwapService(config)

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

export type OpenOceanDataProvider = ReturnType<
  typeof createOpenOceanDataProvider
>
