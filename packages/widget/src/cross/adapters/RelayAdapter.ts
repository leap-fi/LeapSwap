import {
  MAINNET_RELAY_API,
  type RelayChain,
  convertViemChainToRelayChain,
  createClient,
  getClient,
  type QuoteBodyOptions,
} from '@relayprotocol/relay-sdk'
import { type WalletClient, formatUnits } from 'viem'
import {
  arbitrum,
  avalanche,
  base,
  berachain,
  blast,
  bsc,
  fantom,
  linea,
  mainnet,
  mantle,
  optimism,
  polygon,
  ronin,
  scroll,
  sonic,
  unichain,
  zksync,
  celo,
  monad,
} from 'viem/chains'
import type { Currency } from '../constants/index.js'

import {
  CROSS_CHAIN_FEE_RECEIVER,
  MAINNET_NETWORKS,
  ZERO_ADDRESS,
} from '../constants/index.js'

import type { Quote } from '../registry.js'
import {
  BaseSwapAdapter,
  type Chain,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
  NonEvmChain,
  NewEvmChain,
  type NormalizedQuote,
  type NormalizedTxResponse,
  type QuoteParams,
  type SwapStatus,
} from './BaseSwapAdapter.js'

import { defineChain } from 'viem'
import { ChainId } from '../../index.js'

const hyperEvm = defineChain({
  id: 999,
  name: 'HyperEvm',
  network: 'hyperevm',
  nativeCurrency: {
    decimals: 18,
    name: 'HYPE',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
    public: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://hyperevmscan.io' },
  },
})

const plasma = defineChain({
  id: 9745,
  name: 'Plasma',
  blockTime: 1000,
  nativeCurrency: {
    name: 'Plasma',
    symbol: 'XPL',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.plasma.to'],
    },
  },
  blockExplorers: {
    default: {
      name: 'PlasmaScan',
      url: 'https://plasmascan.to',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 0,
    },
  },
})


const SolanaChainId = 792703809
const BitcoinChainId = 8253038
const BitcoinAddress = 'bc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqmql8k8'

const solanaChain = {
  id: SolanaChainId,
  name: 'Solana',
  displayName: 'Solana',
  vmType: 'svm' as const,
} as RelayChain

const bitcoinChain = {
  id: BitcoinChainId,
  name: 'Bitcoin',
  displayName: 'Bitcoin',
  vmType: 'bvm' as const,
} as RelayChain
export class RelayAdapter extends BaseSwapAdapter {
  constructor() {
    super()
    createClient({
      baseApiUrl: MAINNET_RELAY_API,
      source: 'leapswap',
      chains: [
        arbitrum,
        avalanche,
        base,
        berachain,
        blast,
        bsc,
        fantom,
        linea,
        mainnet,
        mantle,
        optimism,
        polygon,
        scroll,
        sonic,
        zksync,
        ronin,
        unichain,
        hyperEvm,
        plasma,
        celo,
        monad,
      ]
        .map(convertViemChainToRelayChain)
        .concat(solanaChain as any, bitcoinChain as any),
    })
  }

  getName(): string {
    return 'Relay'
  }
  getIcon(): string {
    return 'https://storage.googleapis.com/ks-setting-1d682dca/84e906bb-eaeb-45d3-a64c-2aa9c84eb3ea1747759080942.png'
  }
  getSupportedChains(): Chain[] {
    return [NonEvmChain.Solana, NonEvmChain.Bitcoin, NewEvmChain.Plasma, NewEvmChain.Monad, ...MAINNET_NETWORKS.filter(chain => chain !== ChainId.FLR)]
    // return [...MAINNET_NETWORKS]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: QuoteParams): Promise<NormalizedQuote> {
    const evmFromToken = params.fromToken as Currency
    const evmToToken = params.toToken as Currency
    let currency = evmFromToken.isNative ? ZERO_ADDRESS : evmFromToken.address
    let toCurrency = evmToToken.isNative ? ZERO_ADDRESS : evmToToken.address

    let chainId = +params.fromChain
    if (params.fromChain === NonEvmChain.Solana) {
      chainId = SolanaChainId
    } else if (params.fromChain === NonEvmChain.Bitcoin) {
      chainId = BitcoinChainId
      currency = BitcoinAddress
    }
    let toChainId = +params.toChain
    if (params.toChain === NonEvmChain.Solana) {
      toChainId = SolanaChainId
    } else if (params.toChain === NonEvmChain.Bitcoin) {
      toChainId = BitcoinChainId
      toCurrency = BitcoinAddress
    }
    const quoteParams = {
      chainId: chainId,
      toChainId: toChainId,
      currency,
      toCurrency,
      amount: params.amount,
      tradeType: 'EXACT_INPUT' as QuoteBodyOptions['tradeType'],
      wallet: params.walletClient,
      recipient: params.recipient,
      user: params.sender,
      options: {
        appFees: [
          {
            recipient: CROSS_CHAIN_FEE_RECEIVER,
            // recipient:
            //   params.fromChain === NonEvmChain.Solana
            //     ? CROSS_CHAIN_FEE_RECEIVER_SOLANA
            //     : CROSS_CHAIN_FEE_RECEIVER,
            fee: params.feeBps.toString(),
          },
        ],
        protocolVersion: 'preferV2' as 'preferV2' | 'v1' | 'v2',
        // includedSwapSources: ['open-ocean'],
      },
    }
    const resp = await getClient().actions.getQuote(quoteParams)
    const formattedOutputAmount = formatUnits(
      BigInt(resp.details?.currencyOut?.amount || '0'),
      params.toToken.decimals
    )
    const formattedInputAmount = formatUnits(
      BigInt(params.amount),
      params.fromToken.decimals
    )
    const inputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(
      params.fromChain
    )
      ? Number(resp.details?.currencyIn?.amountUsd || 0)
      : params.tokenInUsd * +formattedInputAmount
    const outputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(
      params.toChain
    )
      ? Number(resp.details?.currencyOut?.amountUsd || 0)
      : params.tokenOutUsd * +formattedOutputAmount
    if (params.walletClient) {
      params.walletClient = {
        account: {
          address: params.sender,
        },
      } as any
    }
    const protocolFee: any = resp.fees?.relayer?.amountUsd || 0

    return {
      quoteParams: params,
      outputAmount: BigInt(resp.details?.currencyOut?.amount || '0'),
      formattedOutputAmount,
      inputUsd,
      outputUsd,
      priceImpact:
        !inputUsd || !outputUsd
          ? Number.NaN
          : ((inputUsd - outputUsd) * 100) / inputUsd,
      //rate: Number(resp.details?.rate || 0),
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd: Number(resp.fees?.gas?.amountUsd || 0),
      timeEstimate: resp.details?.timeEstimate || 0,
      // Relay dont need to approve, we send token to contract directly
      contractAddress: ZERO_ADDRESS,
      rawQuote: resp,
      protocolFee: protocolFee,
      platformFeePercent: (params.feeBps * 100) / 10000,
    }
  }

  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient
  ): Promise<NormalizedTxResponse> {
    return new Promise<NormalizedTxResponse>((resolve, reject) => {
      getClient()
        .actions.execute({
          quote: quote.rawQuote,
          wallet: walletClient,
          onProgress: ({ currentStep }) => {
            if (
              currentStep?.id === 'deposit' &&
              currentStep.requestId &&
              currentStep.kind === 'transaction'
            ) {
              const txHash = currentStep.items?.[0]?.txHashes?.[0].txHash
              if (txHash) {
                resolve({
                  sender: quote.quoteParams.sender,
                  sourceTxHash: txHash,
                  adapter: this.getName(),
                  id: currentStep.requestId,
                  sourceChain: quote.quoteParams.fromChain,
                  targetChain: quote.quoteParams.toChain,
                  inputAmount: quote.quoteParams.amount,
                  outputAmount: quote.outputAmount.toString(),
                  sourceToken: quote.quoteParams.fromToken,
                  targetToken: quote.quoteParams.toToken,
                  timestamp: new Date().getTime(),
                })
              }
            }
          },
        })
        .catch((e) => {
          reject(e) // Make sure errors from execute are also caught
        })
    })
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const res = await fetch(
      `https://api.relay.link/intents/status/v2?requestId=${p.id}`
    ).then((r) => r.json())

    return {
      txHash: res.txHashes?.[0] || '',
      status:
        res.status === 'success'
          ? 'Success'
          : res.status === 'refund'
            ? 'Refunded'
            : res.status === 'failure'
              ? 'Failed'
              : 'Processing',
    }
  }
}
