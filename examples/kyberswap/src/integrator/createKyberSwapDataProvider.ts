import type {
  GasPriceResult,
  SwapDataProvider,
  SwapQuoteParams,
  SwapQuoteRequestParams,
  SwapQuoteResult,
  TokenAmount,
} from '@leapswap/widget'
import {
  DEFAULT_CLIENT_ID,
  getChainSlug,
  KYBER_AGGREGATOR_BASE,
  KYBER_NATIVE,
  KYBER_TOKEN_API,
  LLAMA_CHAIN,
  PUBLIC_RPC,
  TOKEN_PRICE_API,
  toKyberFeeAmount,
  toKyberTokenAddress,
  toSlippageBps,
  ZERO_ADDRESS,
} from './constants.js'

export interface KyberSwapDataProviderConfig {
  /** Sent as `X-Client-Id` (required by Kyber for higher rate limits). */
  clientId?: string
}

type KyberRouteSummary = Record<string, unknown> & {
  amountOut?: string
  amountInUsd?: string
  amountOutUsd?: string
  gas?: string
  gasPrice?: string
  gasUsd?: string
  l1FeeUsd?: string
  routeID?: string
}

type KyberRouteResponse = {
  code: number
  message?: string
  data?: {
    routeSummary: KyberRouteSummary
    routerAddress: string
  }
}

type KyberBuildResponse = {
  code: number
  message?: string
  data?: {
    amountOut?: string
    amountInUsd?: string
    amountOutUsd?: string
    gas?: string
    gasUsd?: string
    data?: string
    routerAddress?: string
    transactionValue?: string
  }
}

type KyberToken = {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

function clientId(config: KyberSwapDataProviderConfig): string {
  return (
    config.clientId ||
    import.meta.env.VITE_KYBER_CLIENT_ID ||
    DEFAULT_CLIENT_ID
  )
}

function headers(config: KyberSwapDataProviderConfig, json = false): HeadersInit {
  const h: Record<string, string> = {
    'X-Client-Id': clientId(config),
  }
  if (json) {
    h['Content-Type'] = 'application/json'
  }
  return h
}

function feeQuery(params: SwapQuoteParams): Record<string, string> {
  const address = params.referrer?.address
  const feeAmount = toKyberFeeAmount(params.referrer?.fee)
  if (!address || !feeAmount) {
    return {}
  }
  return {
    feeAmount,
    isInBps: 'true',
    chargeFeeBy: 'currency_in',
    feeReceiver: address,
  }
}

async function fetchRoute(
  config: KyberSwapDataProviderConfig,
  params: SwapQuoteParams
): Promise<{ routeSummary: KyberRouteSummary; routerAddress: string }> {
  const slug = getChainSlug(params.chainId)
  const query = new URLSearchParams({
    tokenIn: toKyberTokenAddress(params.fromToken.address),
    tokenOut: toKyberTokenAddress(params.toToken.address),
    amountIn: params.amount,
    gasInclude: 'true',
    ...feeQuery(params),
  })
  if (params.gasPrice) {
    query.set('gasPrice', params.gasPrice)
  }
  if (params.account) {
    query.set('origin', params.account)
  }

  const res = await fetch(
    `${KYBER_AGGREGATOR_BASE}/${slug}/api/v1/routes?${query}`,
    { headers: headers(config) }
  )
  const json = (await res.json()) as KyberRouteResponse
  if (!res.ok || json.code !== 0 || !json.data?.routeSummary) {
    throw new Error(json.message || `KyberSwap route failed (${res.status})`)
  }
  return json.data
}

async function buildRoute(
  config: KyberSwapDataProviderConfig,
  params: SwapQuoteRequestParams,
  routeSummary: KyberRouteSummary,
  routerAddress: string
): Promise<KyberBuildResponse['data']> {
  const slug = getChainSlug(params.chainId)
  const body = {
    routeSummary,
    sender: params.account,
    recipient: params.account,
    slippageTolerance: toSlippageBps(params.slippage),
    origin: params.account,
    source: clientId(config),
  }
  const res = await fetch(
    `${KYBER_AGGREGATOR_BASE}/${slug}/api/v1/route/build`,
    {
      method: 'POST',
      headers: headers(config, true),
      body: JSON.stringify(body),
    }
  )
  const json = (await res.json()) as KyberBuildResponse
  if (!res.ok || json.code !== 0 || !json.data) {
    throw new Error(json.message || `KyberSwap build failed (${res.status})`)
  }
  // ensure router from GET is available if build omits it
  if (!json.data.routerAddress) {
    json.data.routerAddress = routerAddress
  }
  return json.data
}

function mapQuoteResult(args: {
  chainId: number
  routeSummary: KyberRouteSummary
  routerAddress: string
  built?: KyberBuildResponse['data']
  account?: string
}): SwapQuoteResult {
  const { chainId, routeSummary, routerAddress, built, account } = args
  const outAmount = String(built?.amountOut ?? routeSummary.amountOut ?? '0')
  const estimatedGas = String(built?.gas ?? routeSummary.gas ?? '')
  const approvalAddress = built?.routerAddress || routerAddress

  return {
    outAmount,
    fromAmountUSD: String(
      built?.amountInUsd ?? routeSummary.amountInUsd ?? '0'
    ),
    toAmountUSD: String(
      built?.amountOutUsd ?? routeSummary.amountOutUsd ?? '0'
    ),
    estimatedGas: estimatedGas || undefined,
    approvalAddress,
    transaction: built?.data
      ? {
          chainId,
          from: account,
          to: approvalAddress,
          data: built.data,
          value: built.transactionValue || '0',
          gasPrice:
            routeSummary.gasPrice !== undefined
              ? String(routeSummary.gasPrice)
              : undefined,
          type: 'kyberswap',
        }
      : {
          chainId,
          to: approvalAddress,
          type: 'kyberswap',
        },
    tool: {
      key: 'kyberswap',
      name: 'KyberSwap',
    },
    orderId:
      routeSummary.routeID !== undefined
        ? String(routeSummary.routeID)
        : undefined,
    raw: {
      routeSummary,
      routerAddress,
      built: built ?? null,
    },
  }
}

function mapToken(token: KyberToken, priceUSD = '0'): TokenAmount {
  const address =
    token.address.toLowerCase() === KYBER_NATIVE.toLowerCase()
      ? ZERO_ADDRESS
      : token.address
  return {
    address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    chainId: token.chainId,
    logoURI: token.logoURI,
    priceUSD,
  }
}

/**
 * Widget needs `priceUSD` on tokens for Est. Gas Fee (native × gas) and Price impact.
 * Kyber token APIs do not expose USD; this example fills prices via DefiLlama.
 */
async function fetchTokenPrices(
  chainId: number,
  tokenAddresses: string[]
): Promise<Record<string, string>> {
  const llamaChain = LLAMA_CHAIN[chainId]
  if (!llamaChain || tokenAddresses.length === 0) {
    return {}
  }
  const coins = [
    ...new Set(
      tokenAddresses.map((addr) => {
        const a = addr.toLowerCase()
        const onChain =
          !addr ||
          a === ZERO_ADDRESS.toLowerCase() ||
          a === KYBER_NATIVE.toLowerCase()
            ? ZERO_ADDRESS
            : addr
        return `${llamaChain}:${onChain}`
      })
    ),
  ]
  const res = await fetch(`${TOKEN_PRICE_API}/${coins.join(',')}`)
  if (!res.ok) {
    return {}
  }
  const json = (await res.json()) as {
    coins?: Record<string, { price?: number }>
  }
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(json.coins ?? {})) {
    if (value?.price === undefined || !Number.isFinite(value.price)) {
      continue
    }
    const address = key.slice(key.indexOf(':') + 1).toLowerCase()
    out[address] = String(value.price)
  }
  return out
}

async function withPrices(
  chainId: number,
  tokens: TokenAmount[]
): Promise<TokenAmount[]> {
  const prices = await fetchTokenPrices(
    chainId,
    tokens.map((t) => t.address)
  )
  return tokens.map((t) => ({
    ...t,
    priceUSD: prices[t.address.toLowerCase()] ?? t.priceUSD ?? '0',
  }))
}

/**
 * Example-local KyberSwap → Widget `SwapDataProvider` adapter.
 * Kyber quirks stay here; Widget only sees generic fields.
 */
export function createKyberSwapDataProvider(
  config: KyberSwapDataProviderConfig = {}
): SwapDataProvider {
  return {
    async getQuote(params) {
      const { routeSummary, routerAddress } = await fetchRoute(config, params)
      return mapQuoteResult({
        chainId: params.chainId,
        routeSummary,
        routerAddress,
        account: params.account,
      })
    },

    async getSwapQuote(params) {
      const { routeSummary, routerAddress } = await fetchRoute(config, params)
      const built = await buildRoute(
        config,
        params,
        routeSummary,
        routerAddress
      )
      return mapQuoteResult({
        chainId: params.chainId,
        routeSummary,
        routerAddress,
        built,
        account: params.account,
      })
    },

    async getTokenList(chainId) {
      const id = Number(chainId)
      const res = await fetch(
        `${KYBER_TOKEN_API}?chainIds=${id}&page=1&pageSize=100`,
        { headers: headers(config) }
      )
      const json = (await res.json()) as {
        code?: number
        data?: { tokens?: KyberToken[] }
      }
      const tokens = json.data?.tokens ?? []
      const mapped = tokens.map((t) => mapToken(t))
      if (
        !mapped.some((t) => t.address.toLowerCase() === ZERO_ADDRESS.toLowerCase())
      ) {
        mapped.unshift({
          address: ZERO_ADDRESS,
          symbol: id === 56 ? 'BNB' : id === 137 ? 'POL' : 'ETH',
          name: id === 56 ? 'BNB' : id === 137 ? 'POL' : 'Ether',
          decimals: 18,
          chainId: id,
          priceUSD: '0',
        })
      }
      return withPrices(id, mapped)
    },

    async getGasPrice(chainId) {
      const id = Number(chainId)
      const rpc = PUBLIC_RPC[id]
      if (!rpc) {
        return { gasPrice: '0' } satisfies GasPriceResult
      }
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_gasPrice',
          params: [],
        }),
      })
      const json = (await res.json()) as { result?: string }
      const gasPrice = json.result ? BigInt(json.result).toString() : '0'
      return { gasPrice, standard: gasPrice, fast: gasPrice, instant: gasPrice }
    },

    async getTokenInfo(chainId, tokenAddress) {
      const id = Number(chainId)
      const kyberAddr = toKyberTokenAddress(tokenAddress)
      const res = await fetch(
        `${KYBER_TOKEN_API}?chainIds=${id}&addresses=${kyberAddr}`,
        { headers: headers(config) }
      )
      const json = (await res.json()) as {
        data?: { tokens?: KyberToken[] }
      }
      const token = json.data?.tokens?.[0]
      if (!token) {
        throw new Error(`Token not found: ${tokenAddress} on ${chainId}`)
      }
      const [priced] = await withPrices(id, [mapToken(token)])
      return priced
    },

    async getTokensPrice(chainId, tokenAddresses) {
      return fetchTokenPrices(Number(chainId), tokenAddresses)
    },

    async getRpcUrl() {
      return PUBLIC_RPC[1] || ''
    },
  }
}
