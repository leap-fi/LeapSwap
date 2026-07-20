import type { ChainsProvider } from '@leapswap/widget-sdk'
import { ChainKey, ChainType, CoinKey } from '@leapswap/widget-types'

const nativeEth = {
  address: '0x0000000000000000000000000000000000000000',
  symbol: 'ETH',
  decimals: 18,
  name: 'Ether',
  chainId: 1,
  priceUSD: '0',
}

/**
 * Minimal static chains so the example UI can load.
 * Replace with your own chainsProvider (backend or static list).
 */
export const chainsProvider: ChainsProvider = async () => [
  {
    key: ChainKey.ETH,
    chainType: ChainType.EVM,
    name: 'Ethereum',
    coin: CoinKey.ETH,
    id: 1,
    mainnet: true,
    nativeToken: nativeEth,
  },
  {
    key: ChainKey.ARB,
    chainType: ChainType.EVM,
    name: 'Arbitrum',
    coin: CoinKey.ETH,
    id: 42161,
    mainnet: true,
    nativeToken: { ...nativeEth, chainId: 42161 },
  },
]
