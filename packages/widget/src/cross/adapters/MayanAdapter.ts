import {
  type ChainName,
  type Quote as MayanQuote,
  type QuoteOptions,
  addresses,
  fetchQuote,
  getSwapFromEvmTxPayload,
} from '@mayanfinance/swap-sdk'
import { ChainId } from '@leapswap/widget-sdk'
import { formatUnits } from 'viem'

import {
  CROSS_CHAIN_FEE_RECEIVER,
  CROSS_CHAIN_FEE_RECEIVER_SOLANA,
  type Currency,
  ZERO_ADDRESS,
} from '../constants/index.js'

import type { WalletClient } from 'viem'
import type { Quote } from '../registry.js'
import {
  BaseSwapAdapter,
  type Chain,
  type EvmQuoteParams,
  type NormalizedQuote,
  type NormalizedTxResponse,
  type SwapStatus,
} from './BaseSwapAdapter.js'

const mappingChain: Record<string, ChainName> = {
  [ChainId.ETH]: 'ethereum',
  [ChainId.BSC]: 'bsc',
  [ChainId.POL]: 'polygon',
  [ChainId.AVA]: 'avalanche',
  [ChainId.ARB]: 'arbitrum',
  [ChainId.OPT]: 'optimism',
  [ChainId.BAS]: 'base',
  [ChainId.UNI]: 'unichain',
  // [ChainId.LIN]: 'linea',
  [ChainId.HYE]: 'hyperevm',
  [ChainId.SOL]: 'solana',
  [ChainId.SUI]: 'sui',
  // [ChainId.PLA]: 'plasma',
}

function getMayanApiKey(): string | undefined {
  try {
    return typeof process !== 'undefined'
      ? (process as NodeJS.Process).env?.MAYAN_API_KEY
      : undefined
  } catch {
    return undefined
  }
}

function getMayanFetchQuoteOptions(): QuoteOptions | undefined {
  const apiKey = getMayanApiKey()
  return apiKey ? { apiKey } : undefined
}

export class MayanAdapter extends BaseSwapAdapter {
  getName(): string {
    return 'Mayan'
  }
  getIcon(): string {
    return 'https://swap.mayan.finance/favicon.ico'
  }
  getSupportedChains(): Chain[] {
    return [...Object.keys(mappingChain).map(Number)]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: EvmQuoteParams): Promise<NormalizedQuote> {
    const fromChainName = mappingChain[params.fromChain]
    const toChainName = mappingChain[params.toChain]
    if (!fromChainName || !toChainName) {
      throw new Error('No quotes found')
    }

    let slippageBps = params.slippage > 0 ? params.slippage / 100 : ('auto' as const)
    if (+slippageBps > 5) {
      slippageBps = 5
    }
    const quoteParams = {
      amountIn64: params.amount,
      fromToken: params.fromToken.isNative
        ? ZERO_ADDRESS
        : params.fromToken.address,
      toToken: params.toToken.isNative ? ZERO_ADDRESS : params.toToken.address,
      fromChain: fromChainName,
      toChain: toChainName,
      slippageBps: slippageBps,
      referrer: CROSS_CHAIN_FEE_RECEIVER,
      referrerBps: params.feeBps,
      ...(params.recipient ? { destinationAddress: params.recipient } : {}),
    }
    const quotes = await fetchQuote(quoteParams, getMayanFetchQuoteOptions())
    if (!quotes?.[0]) {
      throw new Error('No quotes found')
    }

    const topQuote = quotes[0]
    const formattedInputAmount = formatUnits(
      BigInt(params.amount),
      params.fromToken.decimals
    )
    const outputAmount = BigInt(topQuote.expectedAmountOutBaseUnits)
    const formattedOutputAmount = formatUnits(
      outputAmount,
      params.toToken.decimals
    )

    const tokenInUsd = params.tokenInUsd
    const tokenOutUsd = params.tokenOutUsd
    const inputUsd = tokenInUsd * +formattedInputAmount
    const outputUsd = tokenOutUsd * +formattedOutputAmount

    const usdPriceImpact =
      !inputUsd || !outputUsd
        ? Number.NaN
        : ((inputUsd - outputUsd) * 100) / inputUsd
    const sdkPriceImpact =
      topQuote.priceImpact != null ? Number(topQuote.priceImpact) : Number.NaN

    return {
      quoteParams: params,

      outputAmount,

      formattedOutputAmount,

      inputUsd,
      outputUsd,
      priceImpact: Number.isFinite(sdkPriceImpact) ? sdkPriceImpact : usdPriceImpact,
      rate:
        +formattedInputAmount > 0
          ? +formattedOutputAmount / +formattedInputAmount
          : 0,
      gasFeeUsd: 0,

      timeEstimate: topQuote.etaSeconds,
      contractAddress: addresses.MAYAN_FORWARDER_CONTRACT,
      rawQuote: topQuote,

      protocolFee: topQuote.clientRelayerFeeSuccess || 0,
      platformFeePercent: (params.feeBps * 100) / 10_000,
    }
  }

  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient
  ): Promise<NormalizedTxResponse> {
    const account: any = quote.quoteParams.sender
    if (!account) {
      throw new Error('WalletClient account is not defined')
    }

    if (!quote.quoteParams.fromChain) {
      throw new Error(`Invalid fromChain: ${quote.quoteParams.fromChain}`)
    }
    const fromChain =
      quote.quoteParams.fromChain === ChainId.SOL
        ? 'solana'
        : quote.quoteParams.fromChain

    if (fromChain === 'solana') {
      // const res = getSwapSolana({
      //   amountIn64: quote.quoteParams.amount,
      //   fromToken: quote.quoteParams.fromToken,
      //   minMiddleAmount: 0,
      //   middleToken: quote.quoteParams.toToken,
      //   userWallet: account,
      //   slippageBps: quote.quoteParams.slippage,
      //   referrerAddress: CROSS_CHAIN_FEE_RECEIVER,
      // })
    } else {
      const mayanQuote = quote.rawQuote as MayanQuote
      // Gasless Swift：需 EIP-712 签名 + submitSwiftEvmSwap，不能走普通 sendTransaction（见 SDK swapFromEvm）
      if (mayanQuote.type === 'SWIFT' && mayanQuote.gasless) {
        throw new Error(
          'Mayan gasless Swift 订单需使用 @mayanfinance/swap-sdk 的 swapFromEvm（EIP-712 + 提交订单），当前适配器仅支持链上交易 payload'
        )
      }

      const mayanApiKey = getMayanApiKey()
      // v13+ getSwapFromEvmTxPayload 为异步；referrerAddresses 需按网络类型提供（文档）
      const res = await getSwapFromEvmTxPayload(
        mayanQuote,
        account,
        quote.quoteParams.recipient,
        {
          evm: CROSS_CHAIN_FEE_RECEIVER,
          solana: CROSS_CHAIN_FEE_RECEIVER_SOLANA,
        },
        account,
        fromChain,
        null,
        null,
        mayanApiKey ? { apiKey: mayanApiKey } : undefined
      )
      if (res.to && res.value && res.data) {
        const tx = await walletClient.sendTransaction({
          chain: undefined,
          account: account as `0x${string}`,
          to: res.to as `0x${string}`,
          value: BigInt(res.value),
          data: res.data as `0x${string}`,
          kzg: undefined,
        })
        return {
          sender: quote.quoteParams.sender,
          id: tx, // specific id for each provider
          sourceTxHash: tx,
          adapter: this.getName(),
          sourceChain: quote.quoteParams.fromChain,
          targetChain: quote.quoteParams.toChain,
          inputAmount: quote.quoteParams.amount,
          outputAmount: quote.outputAmount.toString(),
          sourceToken: quote.quoteParams.fromToken,
          targetToken: quote.quoteParams.toToken,
          timestamp: new Date().getTime(),
        }
      }
    }

    throw new Error('Can not get Mayan data to swap')
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const res = await fetch(
      `https://explorer-api.mayan.finance/v3/swap/trx/${p.id}`
    ).then((r) => r.json())

    const clientStatus = res.clientStatus ?? res.status
    const legacy = res.status

    let status: SwapStatus['status'] = 'Processing'
    if (
      clientStatus === 'COMPLETED' ||
      legacy === 'ORDER_SETTLED'
    ) {
      status = 'Success'
    } else if (
      clientStatus === 'REFUNDED' ||
      legacy === 'ORDER_REFUNDED'
    ) {
      status = 'Refunded'
    } else if (legacy === 'ORDER_CANCELED') {
      status = 'Failed'
    }

    return {
      txHash: res.fulfillTxHash || '',
      status,
    }
  }
}
