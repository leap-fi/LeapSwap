import type { WalletClient } from 'viem'
import type { QuoteParams } from './adapters/index.js'
import { CrossChainSwapFactory } from './factory.js'
import { CrossChainSwapAdapterRegistry, type Quote } from './registry.js'

/**
 * Get cross-chain aggregated quotes (supports multiple adapter comparison)
 * @param params - Cross-chain quote parameters
 * @returns Best quote result, compatible with useRoutes.ts requirements
 */
export async function getCrossChainQuote({
  fromMsg,
  toMsg,
  inAmount,
  slippage_tolerance,
  account,
  recipient,
  tokenInUsd = 0,
  tokenOutUsd = 0,
  feeBps = 10,
  walletClient,
  publicKey,
  nearTokens = [],
}: {
  fromMsg: any
  toMsg: any
  inAmount: string
  slippage_tolerance: string | number
  account: string
  recipient?: string
  tokenInUsd?: number
  tokenOutUsd?: number
  feeBps?: number
  walletClient?: any
  publicKey?: string
  nearTokens?: any[]
}): Promise<any | null> {
  try {
    // 1. Register all Adapters
    const registry = new CrossChainSwapAdapterRegistry()
    CrossChainSwapFactory.getAllAdapters().forEach((adapter) => {
      registry.registerAdapter(adapter)
    })

    let slippage = typeof slippage_tolerance === 'string'
      ? Number.parseFloat(slippage_tolerance)
      : slippage_tolerance
    slippage = Math.floor(slippage * 10000) / 100
    // 2. Construct QuoteParams
    const params: QuoteParams = {
      feeBps,
      fromChain: fromMsg.chainId,
      toChain: toMsg.chainId,
      fromToken: fromMsg,
      toToken: toMsg,
      amount: inAmount,
      slippage: slippage,
      walletClient,
      tokenInUsd,
      tokenOutUsd,
      sender: account,
      recipient: recipient || '',
      publicKey,
      isNative: fromMsg.isNative || toMsg.isNative,
    }

    if (fromMsg.chainId === 'near' || toMsg.chainId === 'near') {
      ; (params as any).nearTokens = nearTokens
    }

    // 3. Get all quotes
    const adapters = registry.getAllAdapters().filter((adapter) => {
      return (
        adapter.getSupportedChains().includes(params.fromChain) &&
        adapter.getSupportedChains().includes(params.toChain)
      )
    })
    if (adapters.length === 0) {
      console.warn('No supported adapters found for the specified chains')
      return null
    }

    const quoteResults: Quote[] = []
    let errorMsg = ''
    // Get quotes from all adapters in parallel
    const quotePromises = adapters.map(async (adapter) => {
      try {
        const quote = await adapter.getQuote(params)
        if (quote) {
          quoteResults.push({ adapter, quote })
        }
      } catch (error) {
        errorMsg = error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error')
        // Ignore individual adapter errors, continue getting quotes from other adapters
        console.warn(`Failed to get quote from ${adapter.getName()}:`, error)
      }
    })

    await Promise.all(quotePromises)

    if (quoteResults.length === 0) {
      console.warn('No valid quotes found from any adapter')
      throw new Error(errorMsg)
      // return { error: errorMsg }
    }

    // 4. Select best quote (highest outputAmount)
    quoteResults.sort((a, b) =>
      a.quote.outputAmount < b.quote.outputAmount ? 1 : -1
    )

    const best = quoteResults[0]
    const adapterName = best.adapter?.getName() || 'Bridge'
    const adapterKey = adapterName.toLowerCase()
    const contractAddress = best.quote.contractAddress || '0x0'
    const txValue =
      best.quote.rawQuote.transactionRequest?.value ||
      best.quote.rawQuote.tx?.value ||
      '0x0'
    const txData =
      best.quote.rawQuote.transactionRequest?.data ||
      best.quote.rawQuote.tx?.data ||
      '0x'

    // Normalize to widget SwapQuoteResult — adapters stay vendor-aware here.
    return {
      isBridge: true,
      outAmount: best.quote.outputAmount || '0',
      minOutAmount: best.quote.outputAmount || '0',
      fromAmountUSD: best.quote.inputUsd?.toString() || '0',
      toAmountUSD: best.quote.outputUsd?.toString() || '0',
      transaction: {
        chainId: Number(fromMsg.chainId) || undefined,
        from: account,
        to: contractAddress,
        data: String(txData),
        value: String(txValue),
        type: adapterKey,
      },
      approvalAddress: contractAddress,
      executionDuration: best.quote.timeEstimate || 300,
      feeCosts: [
        {
          name: `${adapterName} Fee`,
          description: 'Protocol fee',
          amount: '0',
          amountUSD: best.quote.protocolFee?.toString?.() ?? String(best.quote.protocolFee ?? '0'),
          percentage: '0',
          included: false,
        },
      ],
      tool: {
        key: adapterKey,
        name: adapterName,
      },
      // Execution payload for bridgeExecuteSwap (adapter key + raw quote)
      raw: {
        quoteAdapterKey: adapterKey,
        quoteRawData: best.quote,
      },
    }
  } catch (error) {
    console.error('Error getting cross-chain quote:', error)
    let errors = [
      {
        message: 'Please connect your wallet first.',
        conditions: [
          'refundTo should not be empty',
          'User is required',
          'fromAddress" is missing'
        ],
      },
      {
        message: 'The input amount is too low.',
        conditions: [
          'Swap output amount is too small to cover fees required to execute swap',
          'Amount is too low for bridge',
          'Amount too small',
          'Amount too low',
        ],
      },
      {
        message: 'Insufficient balance in your wallet.',
        conditions: [
          'Insufficient funds',
          'Failed to get quote',
          'Insufficient balance',
        ],
      },
      {
        message: 'Please enter valid recipient address.',
        conditions: [
          'recipient should not be empty',
          'Recipient is required',
          'Invalid toAddress:'
        ],
      },
      {
        message: 'Not supported token',
        conditions: [
          'not supported to token',
          'not supported from token',
          'no routes found',
          'SDK version too old for monad and solana fast mctp route'
        ],
      },
      {
        message: 'There’s no routes available for the selected token pairs',
        conditions: [
          'No available quotes for the requested transfer',
        ],
      }
    ]
    if (error instanceof Error && error.message) {
      const newError = errors.find(e => e.conditions.some(condition => error.message.indexOf(condition) !== -1))
      if (newError) {
        throw new Error(newError.message)
      } else {
        throw new Error(error.message)
      }
    }
    throw new Error('Unknown error')
  }
}

export const bridgeExecuteSwap = async ({
  quoteData,
  walletClient,
  nearWallet,
}: {
  quoteData: any
  walletClient: WalletClient
  // Near Intents adapter 需要的 Near wallet-selector 实例，其它适配器会忽略
  nearWallet?: any
}) => {
  const adapterName = quoteData.quoteAdapterKey
  const adapter = CrossChainSwapFactory.getAdapterByName(adapterName)
  if (adapter) {
    const result = await (adapter as any)?.executeSwap(
      {
        adapter,
        quote: quoteData.quoteRawData as any,
      },
      walletClient,
      nearWallet
    )
    return result
  }
  return null
}

// Login URL mapping for each adapter
export const ADAPTER_LOGIN_URLS: Record<string, string> = {
  debridge: 'https://app.debridge.finance/',
  across: 'https://across.to/',
  lifi: 'https://jumper.exchange/',
  mayan: 'https://swap.mayan.finance/',
  relay: 'https://app.relay.link/',
  xyfinance: 'https://xy.finance/',
  kyberswap: 'https://kyberswap.com/',
}
