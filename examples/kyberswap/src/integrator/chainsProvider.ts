import type { ChainsProvider } from '@leapswap/widget-sdk'
import type { ExtendedChain } from '@leapswap/widget-types'
import {
  ChainId,
  ChainKey,
  ChainType,
  CoinKey,
} from '@leapswap/widget-types'
import {
  KYBER_CHAINS_API,
  PUBLIC_RPC,
  registerKyberChainSlug,
  registerPublicRpc,
  ZERO_ADDRESS,
} from './constants.js'

type KyberChainConfig = {
  chainId: string
  chainName: string
  displayName: string
  logoUrl: string
}

type KyberChainsResponse = {
  code: number
  message?: string
  data?: {
    config?: KyberChainConfig[]
  }
}

/** Native currency / explorer hints when Setting API only returns id/name/logo. */
type ChainEnrichment = {
  symbol: string
  name: string
  decimals: number
  coin: CoinKey
  explorer: string
  rpc?: string
}

const CHAIN_ENRICHMENT: Record<number, ChainEnrichment> = {
  1: {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://etherscan.io/',
  },
  10: {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://optimistic.etherscan.io/',
  },
  25: {
    symbol: 'CRO',
    name: 'Cronos',
    decimals: 18,
    coin: CoinKey.CRO,
    explorer: 'https://cronoscan.com/',
  },
  56: {
    symbol: 'BNB',
    name: 'BNB',
    decimals: 18,
    coin: CoinKey.BNB,
    explorer: 'https://bscscan.com/',
  },
  130: {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://uniscan.xyz/',
  },
  137: {
    symbol: 'POL',
    name: 'POL',
    decimals: 18,
    coin: CoinKey.POL,
    explorer: 'https://polygonscan.com/',
  },
  143: {
    symbol: 'MON',
    name: 'Monad',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://monadvision.com/',
  },
  146: {
    symbol: 'S',
    name: 'Sonic',
    decimals: 18,
    coin: CoinKey.S,
    explorer: 'https://sonicscan.org/',
  },
  199: {
    symbol: 'BTT',
    name: 'BitTorrent',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://bttcscan.com/',
  },
  250: {
    symbol: 'FTM',
    name: 'Fantom',
    decimals: 18,
    coin: CoinKey.FTM,
    explorer: 'https://ftmscan.com/',
  },
  324: {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://explorer.zksync.io/',
  },
  999: {
    symbol: 'HYPE',
    name: 'HYPE',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://hyperevmscan.io/',
  },
  2020: {
    symbol: 'RON',
    name: 'Ronin',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://app.roninchain.com/',
  },
  4153: {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://explorer.risechain.com/',
  },
  4326: {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://megaeth.com/',
  },
  4663: {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://explorer.robinhoodchain.com/',
  },
  5000: {
    symbol: 'MNT',
    name: 'Mantle',
    decimals: 18,
    coin: CoinKey.MNT,
    explorer: 'https://mantlescan.xyz/',
  },
  8453: {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://basescan.org/',
  },
  42161: {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://arbiscan.io/',
  },
  42793: {
    symbol: 'XTZ',
    name: 'Tez',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://explorer.etherlink.com/',
  },
  43114: {
    symbol: 'AVAX',
    name: 'Avalanche',
    decimals: 18,
    coin: CoinKey.AVAX,
    explorer: 'https://snowtrace.io/',
  },
  59144: {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://lineascan.build/',
  },
  80094: {
    symbol: 'BERA',
    name: 'BERA',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://berascan.com/',
  },
  81457: {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://blastscan.io/',
  },
  534352: {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://scrollscan.com/',
  },
  9745: {
    symbol: 'XPL',
    name: 'Plasma',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: 'https://plasmascan.to/',
  },
}

function chainKeyFromId(chainId: number, chainName: string): ChainKey {
  const matched = (Object.entries(ChainId) as [string, number][]).find(
    ([, id]) => id === chainId
  )
  if (matched) {
    const enumName = matched[0] as keyof typeof ChainKey
    if (ChainKey[enumName]) {
      return ChainKey[enumName]
    }
  }
  return chainName as ChainKey
}

function toExtendedChain(cfg: KyberChainConfig): ExtendedChain {
  const id = Number(cfg.chainId)
  const slug = cfg.chainName
  registerKyberChainSlug(id, slug)

  const enrich = CHAIN_ENRICHMENT[id] ?? {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    coin: CoinKey.ETH,
    explorer: '',
  }
  const rpc = enrich.rpc || PUBLIC_RPC[id] || ''
  if (rpc) {
    registerPublicRpc(id, rpc)
  }

  return {
    key: chainKeyFromId(id, slug),
    chainType: ChainType.EVM,
    name: cfg.displayName || cfg.chainName,
    coin: enrich.coin,
    id,
    mainnet: true,
    logoURI: cfg.logoUrl,
    blockExplorerUrl: enrich.explorer || undefined,
    nativeToken: {
      address: ZERO_ADDRESS,
      symbol: enrich.symbol,
      decimals: enrich.decimals,
      name: enrich.name,
      chainId: id,
      priceUSD: '0',
      logoURI: cfg.logoUrl,
    },
    metamask: {
      chainId: `0x${id.toString(16)}`,
      blockExplorerUrls: enrich.explorer ? [enrich.explorer] : [],
      chainName: cfg.displayName || cfg.chainName,
      nativeCurrency: {
        name: enrich.name,
        symbol: enrich.symbol,
        decimals: enrich.decimals,
      },
      rpcUrls: rpc ? [rpc] : [],
    },
  }
}

/**
 * Loads EVM chains from Kyber Setting API
 * (`configurations/fetch?serviceCode=chains`), including logos.
 */
export const chainsProvider: ChainsProvider = async () => {
  const res = await fetch(KYBER_CHAINS_API)
  if (!res.ok) {
    throw new Error(`Failed to fetch Kyber chains: ${res.status}`)
  }
  const json = (await res.json()) as KyberChainsResponse
  if (json.code !== 0 || !json.data?.config?.length) {
    throw new Error(json.message || 'Kyber chains response empty')
  }

  return json.data.config
    .map(toExtendedChain)
    .sort((a, b) => a.name.localeCompare(b.name))
}
