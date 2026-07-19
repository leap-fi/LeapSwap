import { ChainId } from '@leapswap/widget-sdk'

export const CROSS_CHAIN_FEE_RECEIVER =
  '0x922164BBBd36Acf9E854AcBbF32faCC949fCAEef'
export const CROSS_CHAIN_FEE_RECEIVER_SOLANA =
  'yEVG5DpokLuVRAqoWeKJANBY2wynzgTSXUbGz7aDKBq'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const BTC_DEFAULT_RECEIVER = ''
export const SOLANA_NATIVE = '11111111111111111111111111111111'
export const ETHER_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const TOKEN_API_URL = 'https://token-api.kyberengineering.io/api'
export const NativeCurrencies = {
  [ChainId.ETH]: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    wrapped: {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
  },
  [ChainId.BSC]: {
    name: 'Binance Coin',
    symbol: 'BNB',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    wrapped: {
      name: 'Wrapped BNB',
      symbol: 'WBNB',
      decimals: 18,
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    },
  },
  [ChainId.AVA]: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    wrapped: {
      name: 'Wrapped AVAX',
      symbol: 'WAVAX',
      decimals: 18,
      address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    },
  },
  [ChainId.POL]: {
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    wrapped: {
      name: 'Wrapped MATIC',
      symbol: 'WMATIC',
      decimals: 18,
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    },
  },
  [ChainId.ARB]: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    wrapped: {
      name: 'Wrapped ETH',
      symbol: 'WEHT',
      decimals: 18,
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    },
  },
  [ChainId.OPT]: {
    name: 'Optimism',
    symbol: 'ETH',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    wrapped: {
      name: 'Wrapped ETH',
      symbol: 'WETH',
      decimals: 18,
      address: '0x4200000000000000000000000000000000000006',
    },
  },
  [ChainId.FTM]: {
    name: 'Fantom',
    symbol: 'FTM',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    wrapped: {
      name: 'Wrapped FTM',
      symbol: 'WFTM',
      decimals: 18,
      address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
    },
  },
  [ChainId.BAS]: {
    name: 'Base',
    symbol: 'ETH',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    wrapped: {
      name: 'Wrapped ETH',
      symbol: 'WEHT',
      decimals: 18,
      address: '0x4200000000000000000000000000000000000006',
    },
  },
  [ChainId.SCL]: {
    name: 'Scroll',
    symbol: 'ETH',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    wrapped: {
      name: 'Wrapped ETH',
      symbol: 'WEHT',
      decimals: 18,
      address: '0x5300000000000000000000000000000000000004',
    },
  },
  [ChainId.BLS]: {
    name: 'Blast',
    symbol: 'ETH',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    wrapped: {
      name: 'Wrapped ETH',
      symbol: 'WEHT',
      decimals: 18,
      address: '0x4300000000000000000000000000000000000004',
    },
  },
  [ChainId.MNT]: {
    name: 'Mantle',
    symbol: 'ETH',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    wrapped: {
      name: 'Wrapped MNT',
      symbol: 'WMNT',
      decimals: 18,
      address: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
    },
  },
  [ChainId.SON]: {
    name: 'Son',
    symbol: 'S',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    wrapped: {
      name: 'Wrapped S',
      symbol: 'WS',
      decimals: 18,
      address: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
    },
  },
  [ChainId.UNI]: {
    name: 'UniChain',
    symbol: 'ETH',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    wrapped: {
      name: 'Wrapped ETH',
      symbol: 'WEHT',
      decimals: 18,
      address: '0x4200000000000000000000000000000000000006',
    },
  },
  [ChainId.FLR]: {
    name: 'Flare',
    symbol: 'FLR',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    wrapped: {
      name: 'Wrapped FLR',
      symbol: 'WFLR',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
    },
  },
}
export const MAINNET_NETWORKS = [
  ChainId.ETH,
  ChainId.BSC,
  ChainId.AVA,
  ChainId.BAS,
  ChainId.POL,
  ChainId.ARB,
  ChainId.OPT,
  ChainId.FTM,
  ChainId.MAM,
  ChainId.HYE,
  ChainId.MNT,
  ChainId.SON,
  ChainId.UNI,
  ChainId.BLS,
  ChainId.SCL,
  ChainId.CEL,
  ChainId.MONAD,
  ChainId.FLR,
  ChainId.CRO,
  ChainId.RSK,
  ChainId.MOD,
  ChainId.ONE,
  ChainId.MAM,
  ChainId.KAVA,
  ChainId.TLO,
  ChainId.TAC,
] as const

export interface Currency {
  id: string
  name: string
  symbol: string
  address: string
  icon: string
  logo: string
  decimals: number
  isNative: boolean
  wrapped: {
    name: string
    symbol: string
    decimals: number
    address: string
  }
}

export interface NearToken {
  address: string
  assetId: string
  decimals: number
  blockchain: string
  symbol: string
  price: number
  priceUpdatedAt: number
  contractAddress: string
  logo: string
}

export interface SolanaToken {
  address: string
  id: string
  name: string
  symbol: string
  icon: string
  logo: string
  decimals: number
  tokenProgram: string
}
