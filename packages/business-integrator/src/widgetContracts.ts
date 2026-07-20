/**
 * Local mirror of `@leapswap/widget` SwapDataProvider contracts.
 * Kept here so this package does not depend on the UI package.
 * Must stay in sync with `packages/widget/src/types/swapDataProvider.ts`.
 */

export interface SwapQuoteToken {
  address: string
  symbol: string
  decimals: number
}

export interface SwapQuoteParams {
  chainId: number
  fromToken: SwapQuoteToken
  toToken: SwapQuoteToken
  amount: string
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
  raw?: Record<string, unknown>
}

export interface GasPriceResult {
  gasPrice: string
  standard?: string
  fast?: string
  instant?: string
}
