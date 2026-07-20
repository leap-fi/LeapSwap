import type {
  ChainKey,
  ChainType,
  CoinKey,
  ExtendedChain,
} from '@leapswap/widget-types'
import { OPEN_OCEAN_CHAINS_URL } from './openOceanEndpoints.js'

function convertChainData(data: any[]): ExtendedChain[] {
  return data.map((chain) => {
    const json = {
      key: chain.code as ChainKey,
      chainType: 'EVM' as ChainType,
      name: chain.name,
      coin: chain.symbol as CoinKey,
      id: Number(chain.chainId),
      mainnet: true,
      logoURI: chain.icon,
      tokenlistUrl: chain.tokenlistUrl,
      multicallAddress: chain.multicallAddress,
      relayerSupported: false,
      metamask: chain.metamask,
      nativeToken: chain.nativeToken,
      diamondAddress: chain.exchangeAddress,
      permit2: chain.permit2,
      permit2Proxy: chain.permit2Proxy,
      blockExplorerUrl: chain.blockExplorerUrl?.replace('tx/', ''),
    }
    if (chain.code === 'solana') {
      json.chainType = 'SVM' as ChainType
    }
    if (chain.code === 'near') {
      json.chainType = 'NVM' as ChainType
      json.metamask = {
        blockExplorerUrls: ['https://nearblocks.io'],
      }
      json.nativeToken = {
        address: 'near.near',
        decimals: 24,
        symbol: 'NEAR',
        name: 'NEAR',
        priceUSD: '0',
      }
    }
    return json
  })
}

/** Loads supported chains from the built-in OpenOcean endpoint. */
export async function fetchOpenOceanChains(): Promise<ExtendedChain[]> {
  const response = await fetch(OPEN_OCEAN_CHAINS_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch chains: ${response.status}`)
  }
  const data = await response.json()
  return convertChainData(data.data ?? data)
}
