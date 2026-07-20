import type { TokenAmount } from './token.js'

/** Token identity for same-chain quote requests. */
export interface SwapQuoteToken {
  address: string
  symbol: string
  decimals: number
}

/**
 * Widget-facing same-chain quote request.
 * Integrators must adapt their backend APIs to this shape.
 */
export interface SwapQuoteParams {
  chainId: number
  fromToken: SwapQuoteToken
  toToken: SwapQuoteToken
  /** Amount in smallest unit (wei / lamports / etc.). */
  amount: string
  /** Slippage percent string, e.g. `"1"` = 1%. */
  slippage?: string
  gasPrice?: string
  account?: string
  referrer?: {
    address?: string
    fee?: string
  }
}

export interface SwapQuoteRequestParams extends SwapQuoteParams {
  account: string
}

export interface SwapTransactionRequest {
  chainId?: number
  from?: string
  to?: string
  data?: string
  value?: string
  gasPrice?: string
  /** Aggregator / DEX identifier for execution. */
  type?: string
}

export interface SwapQuoteFeeCost {
  name: string
  description?: string
  amount: string
  amountUSD?: string
  percentage?: string
  included?: boolean
}

export interface SwapQuoteTool {
  key: string
  name: string
  logoURI?: string
}

/**
 * Normalized same-chain quote for Widget route rendering / execution.
 * Do not leak vendor-specific field names here.
 */
export interface SwapQuoteResult {
  outAmount: string
  minOutAmount?: string
  fromAmountUSD?: string
  toAmountUSD?: string
  transaction?: SwapTransactionRequest
  approvalAddress?: string
  estimatedGas?: string
  executionDuration?: number
  feeCosts?: SwapQuoteFeeCost[]
  tool?: SwapQuoteTool
  orderId?: string
  /** Optional raw vendor payload for advanced execution paths. */
  raw?: Record<string, unknown>
}

/**
 * Normalized gas price tiers (plain numeric strings).
 * Integrators flatten vendor-specific shapes (e.g. EIP-1559 objects).
 */
export interface GasPriceResult {
  gasPrice: string
  standard?: string
  fast?: string
  instant?: string
}

/**
 * Same-chain swap data source injected into the Widget.
 * Implement in your integrator package (see `@leapswap/business-integrator`).
 */
export interface SwapDataProvider {
  getQuote(params: SwapQuoteParams): Promise<SwapQuoteResult>
  getSwapQuote(params: SwapQuoteRequestParams): Promise<SwapQuoteResult>
  getTokenList(chainId: number | string): Promise<TokenAmount[]>
  getDexList?(chainId: number | string): Promise<unknown>
  getGasPrice(chainId: number | string): Promise<GasPriceResult>
  getTokenInfo(
    chainId: number | string,
    tokenAddress: string
  ): Promise<TokenAmount>
  getTokensPrice(
    chainId: number | string,
    tokenAddresses: string[]
  ): Promise<Record<string, string>>
  getRpcUrl(): Promise<string>
}
