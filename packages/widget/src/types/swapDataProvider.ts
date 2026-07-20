import type { TokenAmount } from './token.js'

export interface SwapQuoteParams {
  chain: string
  inTokenAddress: string
  inTokenSymbol: string
  outTokenAddress: string
  outTokenSymbol: string
  amount: string
  slippage?: string
  gasPrice?: string
  disabledDexIds?: string
  enabledDexIds?: string
  referrer?: string
  account?: string
  inTokenDecimals?: number
  outTokenDecimals?: number
}

export interface SwapQuoteRequestParams extends SwapQuoteParams {
  account: string
  referrerFee?: string
  referrerFeeShare?: string
}

export interface SwapQuoteResult {
  data?: Record<string, unknown>
  isBridge?: boolean
  error?: string
  [key: string]: unknown
}

export interface GasPriceResult {
  data?: {
    gasPrice?: string
  }
  standard?: string | { maxFeePerGas?: string }
  instant?: string | { maxFeePerGas?: string }
  fast?: string | { maxFeePerGas?: string }
  gasPrice?: string
  [key: string]: unknown
}

export interface SwapDataProvider {
  getQuote(params: SwapQuoteParams): Promise<SwapQuoteResult>
  getSwapQuote(params: SwapQuoteRequestParams): Promise<SwapQuoteResult>
  getTokenList(chain: string): Promise<TokenAmount[]>
  getDexList(chain: string): Promise<unknown>
  getGasPrice(chain: string): Promise<GasPriceResult>
  getTokenInfo(chain: string, tokenAddress: string): Promise<TokenAmount>
  getTokensPrice(
    chain: string,
    tokenAddresses: string[]
  ): Promise<Record<string, string>>
  getRpcUrl(): Promise<string>
}
