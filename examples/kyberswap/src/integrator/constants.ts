/**
 * KyberSwap Aggregator API (v1) — example-local constants.
 * Docs: https://docs.kyberswap.com/developer-guide/aggregator-api
 *
 * In the Vite demo we call same-origin `/kyber-*` proxies (see vite.config.ts)
 * because the browser cannot CORS to Kyber hosts. Official absolute URLs are
 * still used when not running under Vite (e.g. Node tests).
 */

const useViteProxy =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')

export const KYBER_AGGREGATOR_BASE = useViteProxy
  ? '/kyber-aggregator'
  : 'https://aggregator-api.kyberswap.com'

/** Token catalog (Kyber Setting API — used by Kyber frontends; not Aggregator OpenAPI). */
export const KYBER_TOKEN_API = useViteProxy
  ? '/kyber-setting/api/v1/tokens'
  : 'https://ks-setting.kyberswap.com/api/v1/tokens'

/**
 * Chain catalog (same source as Kyber frontend `getChainsConfiguration`).
 * https://ks-setting.kyberswap.com/api/v1/configurations/fetch?serviceCode=chains
 */
export const KYBER_CHAINS_API = useViteProxy
  ? '/kyber-setting/api/v1/configurations/fetch?serviceCode=chains'
  : 'https://ks-setting.kyberswap.com/api/v1/configurations/fetch?serviceCode=chains'

/**
 * USD prices for Widget `getTokensPrice` / token list `priceUSD`.
 * Kyber Setting token API has no prices; Aggregator `gasUsd` alone cannot feed
 * Widget without changing it (Widget = estimatedGas × gasPrice × native.priceUSD).
 * DefiLlama is used only in this example integrator.
 */
export const TOKEN_PRICE_API = useViteProxy
  ? '/llama-prices/prices/current'
  : 'https://coins.llama.fi/prices/current'

/** chainId → DefiLlama coin prefix (`optimism:0x…`). */
export const LLAMA_CHAIN: Record<number, string> = {
  1: 'ethereum',
  10: 'optimism',
  25: 'cronos',
  56: 'bsc',
  130: 'unichain',
  137: 'polygon',
  146: 'sonic',
  250: 'fantom',
  324: 'era',
  8453: 'base',
  42161: 'arbitrum',
  43114: 'avax',
  59144: 'linea',
  5000: 'mantle',
  81457: 'blast',
  534352: 'scroll',
  80094: 'berachain',
}

/** Native token sentinel used by KyberSwap APIs. */
export const KYBER_NATIVE = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/** Default client id — override with VITE_KYBER_CLIENT_ID. */
export const DEFAULT_CLIENT_ID = 'leapswap-kyberswap-example'

/**
 * Static fallback slug map. Prefer values registered from
 * `configurations/fetch?serviceCode=chains` (`chainName`).
 */
export const KYBER_CHAIN_SLUG: Record<number, string> = {
  1: 'ethereum',
  10: 'optimism',
  56: 'bsc',
  137: 'polygon',
  8453: 'base',
  42161: 'arbitrum',
  43114: 'avalanche',
  59144: 'linea',
}

/** Filled by `chainsProvider` from Kyber `chainName` (Aggregator path slug). */
const registeredSlugs = new Map<number, string>()

export function registerKyberChainSlug(chainId: number, slug: string): void {
  registeredSlugs.set(chainId, slug)
}

/** Public HTTP RPCs for eth_gasPrice (example only; extended as chains load). */
export const PUBLIC_RPC: Record<number, string> = {
  1: 'https://ethereum.publicnode.com',
  10: 'https://optimism.publicnode.com',
  25: 'https://evm.cronos.org',
  56: 'https://bsc.publicnode.com',
  137: 'https://polygon.publicnode.com',
  146: 'https://rpc.soniclabs.com',
  199: 'https://rpc.bt.io',
  250: 'https://fantom.publicnode.com',
  324: 'https://mainnet.era.zksync.io',
  130: 'https://mainnet.unichain.org',
  999: 'https://rpc.hyperliquid.xyz/evm',
  2020: 'https://api.roninchain.com/rpc',
  5000: 'https://rpc.mantle.xyz',
  8453: 'https://base.publicnode.com',
  42161: 'https://arbitrum.publicnode.com',
  42793: 'https://node.mainnet.etherlink.com',
  43114: 'https://avalanche.publicnode.com',
  59144: 'https://linea.publicnode.com',
  80094: 'https://rpc.berachain.com',
  81457: 'https://rpc.blast.io',
  534352: 'https://rpc.scroll.io',
  9745: 'https://rpc.plasma.to',
}

export function registerPublicRpc(chainId: number, rpcUrl: string): void {
  if (rpcUrl && !PUBLIC_RPC[chainId]) {
    PUBLIC_RPC[chainId] = rpcUrl
  }
}

export function getChainSlug(chainId: number | string): string {
  const id = Number(chainId)
  const slug = registeredSlugs.get(id) ?? KYBER_CHAIN_SLUG[id]
  if (!slug) {
    throw new Error(`KyberSwap example does not support chainId ${chainId}`)
  }
  return slug
}

export function toKyberTokenAddress(address: string): string {
  const lower = address.toLowerCase()
  if (
    !address ||
    lower === ZERO_ADDRESS.toLowerCase() ||
    lower === KYBER_NATIVE.toLowerCase()
  ) {
    return KYBER_NATIVE
  }
  return address
}

/** Widget slippage percent string (e.g. `"1"` = 1%) → Kyber bps (100 = 1%). */
export function toSlippageBps(slippagePercent?: string): number {
  const pct = Number(slippagePercent ?? '1')
  if (!Number.isFinite(pct) || pct < 0) {
    return 100
  }
  return Math.min(2000, Math.round(pct * 100))
}

/**
 * Widget `referrer.fee` is percent (e.g. `"1"` = 1%).
 * Kyber `feeAmount` + `isInBps` uses base 10000 → 1% = 100.
 */
export function toKyberFeeAmount(feePercent?: string): string | undefined {
  if (!feePercent) {
    return undefined
  }
  const pct = Number(feePercent)
  if (!Number.isFinite(pct) || pct <= 0) {
    return undefined
  }
  return String(Math.round(pct * 100))
}
