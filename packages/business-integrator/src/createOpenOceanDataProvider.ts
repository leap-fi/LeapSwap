import type { TokenAmount } from '@leapswap/widget-types'
import {
  OpenOceanSwapService,
  type OpenOceanSwapServiceConfig,
} from './OpenOceanSwapService.js'
import type {
  GasPriceResult,
  SwapQuoteParams,
  SwapQuoteRequestParams,
  SwapQuoteResult,
} from './widgetContracts.js'

export type OpenOceanDataProviderConfig = OpenOceanSwapServiceConfig

const SOLANA_CHAIN_ID = 1151111081099710

function toOpenOceanQuoteParams(params: SwapQuoteParams) {
  return {
    chain: String(params.chainId),
    inTokenAddress: params.fromToken.address,
    inTokenSymbol: params.fromToken.symbol,
    outTokenAddress: params.toToken.address,
    outTokenSymbol: params.toToken.symbol,
    amount: params.amount,
    slippage: params.slippage,
    gasPrice: params.gasPrice,
    account: params.account,
    referrer: params.referrer?.address,
    inTokenDecimals: params.fromToken.decimals,
    outTokenDecimals: params.toToken.decimals,
    // OpenOcean Solana routing quirk — kept inside this adapter only.
    enabledDexIds: params.chainId === SOLANA_CHAIN_ID ? '6' : '',
  }
}

function toOpenOceanSwapParams(params: SwapQuoteRequestParams) {
  return {
    ...toOpenOceanQuoteParams(params),
    account: params.account,
    referrerFee: params.referrer?.fee,
  }
}

function asString(value: unknown, fallback = '0'): string {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  return String(value)
}

function pickGasTier(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'object' && value !== null && 'maxFeePerGas' in value) {
    const maxFee = (value as { maxFeePerGas?: unknown }).maxFeePerGas
    return maxFee === undefined || maxFee === null ? undefined : String(maxFee)
  }
  return undefined
}

/** Map OpenOcean quote / swap-quote payloads → Widget SwapQuoteResult. */
export function normalizeOpenOceanQuote(raw: unknown): SwapQuoteResult {
  const envelope = (raw ?? {}) as Record<string, unknown>
  const payload = (
    envelope.data && typeof envelope.data === 'object'
      ? envelope.data
      : envelope
  ) as Record<string, unknown>

  const txData =
    payload.transaction ??
    payload.data ??
    (typeof payload.data === 'string' ? payload.data : undefined)

  return {
    outAmount: asString(payload.outAmount),
    minOutAmount:
      payload.minOutAmount !== undefined
        ? asString(payload.minOutAmount)
        : undefined,
    fromAmountUSD:
      payload.fromTokenUSD !== undefined
        ? asString(payload.fromTokenUSD)
        : undefined,
    toAmountUSD:
      payload.toTokenUSD !== undefined
        ? asString(payload.toTokenUSD)
        : undefined,
    transaction: {
      chainId:
        payload.chainId !== undefined ? Number(payload.chainId) : undefined,
      from: payload.from !== undefined ? String(payload.from) : undefined,
      to: payload.to !== undefined ? String(payload.to) : undefined,
      data: txData !== undefined ? String(txData) : undefined,
      value: payload.value !== undefined ? String(payload.value) : undefined,
      gasPrice:
        payload.gasPrice !== undefined ? String(payload.gasPrice) : undefined,
      type: payload.dexId !== undefined ? String(payload.dexId) : undefined,
    },
    approvalAddress:
      payload.approveContract !== undefined
        ? String(payload.approveContract)
        : payload.to !== undefined
          ? String(payload.to)
          : undefined,
    estimatedGas:
      payload.estimatedGas !== undefined
        ? String(payload.estimatedGas)
        : undefined,
    executionDuration:
      payload.executionDuration !== undefined
        ? Number(payload.executionDuration)
        : undefined,
    feeCosts: Array.isArray(payload.feeCosts)
      ? (payload.feeCosts as SwapQuoteResult['feeCosts'])
      : undefined,
    tool: {
      key: 'openocean',
      name: 'OpenOcean',
    },
    orderId:
      payload.orderId !== undefined ? String(payload.orderId) : undefined,
    raw: payload,
  }
}

function normalizeOpenOceanGasPrice(raw: unknown): GasPriceResult {
  const envelope = (raw ?? {}) as Record<string, unknown>
  const nested =
    envelope.data && typeof envelope.data === 'object'
      ? (envelope.data as Record<string, unknown>)
      : envelope

  const standard = pickGasTier(nested.standard ?? envelope.standard)
  const fast = pickGasTier(nested.fast ?? envelope.fast)
  const instant = pickGasTier(nested.instant ?? envelope.instant)
  const gasPrice =
    pickGasTier(nested.gasPrice ?? envelope.gasPrice) ||
    instant ||
    fast ||
    standard ||
    '0'

  return {
    gasPrice,
    standard,
    fast,
    instant,
  }
}

/**
 * OpenOcean reference SwapDataProvider.
 * Widget talks only to the generic SwapDataProvider contract;
 * OpenOcean request/response quirks stay in this adapter.
 */
export function createOpenOceanDataProvider(
  config: OpenOceanDataProviderConfig = {}
) {
  const service = new OpenOceanSwapService(config)

  return {
    async getQuote(params: SwapQuoteParams) {
      const raw = await service.getQuote(toOpenOceanQuoteParams(params))
      return normalizeOpenOceanQuote(raw)
    },
    async getSwapQuote(params: SwapQuoteRequestParams) {
      const raw = await service.getSwapQuote(toOpenOceanSwapParams(params))
      return normalizeOpenOceanQuote(raw)
    },
    getTokenList: (chainId: number | string): Promise<TokenAmount[]> =>
      service.getTokenList(String(chainId)),
    getDexList: (chainId: number | string) =>
      service.getDexList(String(chainId)),
    async getGasPrice(chainId: number | string) {
      const raw = await service.getGasPrice(String(chainId))
      return normalizeOpenOceanGasPrice(raw)
    },
    getTokenInfo: (chainId: number | string, tokenAddress: string) =>
      service.getTokenInfo(String(chainId), tokenAddress),
    getTokensPrice: (chainId: number | string, tokenAddresses: string[]) =>
      service.getTokensPrice(String(chainId), tokenAddresses),
    getRpcUrl: () => service.getRpcUrl(),
  }
}

export type OpenOceanDataProvider = ReturnType<
  typeof createOpenOceanDataProvider
>
