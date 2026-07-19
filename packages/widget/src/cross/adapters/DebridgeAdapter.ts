import type { useWalletSelector } from '@near-wallet-selector/react-hook'
import { ChainId } from '@leapswap/widget-sdk'
import type { WalletAdapterProps } from '@solana/wallet-adapter-base'
import {
  type Connection,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js'
import { type WalletClient, formatUnits } from 'viem'
import type { Currency } from '../constants/index.js'

import { TOKEN_API_URL } from '../constants/index.js'
import {
  CROSS_CHAIN_FEE_RECEIVER,
  CROSS_CHAIN_FEE_RECEIVER_SOLANA,
  ZERO_ADDRESS,
} from '../constants/index.js'
import { NativeCurrencies } from '../constants/index.js'
import type { SolanaToken } from '../constants/index.js'

import type { Quote } from '../registry.js'
import {
  BaseSwapAdapter,
  type Chain,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
  NonEvmChain,
  type NormalizedQuote,
  type NormalizedTxResponse,
  type QuoteParams,
  type SwapStatus,
} from './BaseSwapAdapter.js'

const DEBRIDGE_API = 'https://dln.debridge.finance/v1.0/dln/order'

const mappingChainId: Record<string, number> = {
  [ChainId.DAI]: 100000002,
  [ChainId.MAM]: 100000004, // Metis
  [ChainId.SON]: 100000014, // Sonic
  [ChainId.ABS]: 100000017, // Abstract
  [ChainId.BER]: 100000020, // Berachain
  [ChainId.BOB]: 100000021, // BOB
  [ChainId.MNT]: 100000023, // Mantle
  [NonEvmChain.Solana]: 7565164,
}

export class DeBridgeAdapter extends BaseSwapAdapter {
  constructor() {
    super()
  }

  getName(): string {
    return 'deBridge'
  }
  getIcon(): string {
    return 'https://app.debridge.finance/assets/images/meta-deswap/favicon-32x32.png'
  }
  getSupportedChains(): Chain[] {
    return [
      ChainId.ETH,
      ChainId.BSC,
      ChainId.POL,
      ChainId.AVA,
      ChainId.ARB,
      ChainId.OPT,
      ChainId.ONE,
      ChainId.FSN,
      ChainId.MOR,
      ChainId.CEL,
      ChainId.FUS,
      ChainId.TLO,
      ChainId.CRO,
      ChainId.BOB,
      ChainId.RSK,
      ChainId.VEL,
      ChainId.MOO,
      ChainId.MAM,
      ChainId.AUR,
      ChainId.EVM,
      ChainId.ARN,
      ChainId.ERA,
      ChainId.PZE,
      ChainId.LNA,
      ChainId.BAS,
      ChainId.SCL,
      ChainId.MOD,
      ChainId.MNT,
      ChainId.BLS,
      ChainId.SEI,
      ChainId.FRA,
      ChainId.TAI,
      ChainId.GRA,
      ChainId.IMX,
      ChainId.KAI,
      ChainId.XLY,
      // NonEvmChain.Solana,
    ]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: QuoteParams): Promise<NormalizedQuote> {
    const fromToken = params.fromToken as any
    const toToken = params.toToken as any

    let p: Record<string, string | boolean | number> = {
      srcChainId: mappingChainId[params.fromChain] || params.fromChain,
      srcChainTokenIn:
        params.fromChain === 1151111081099710
          ? (params.fromToken as SolanaToken).id
          : fromToken.isNative
            ? ZERO_ADDRESS
            : fromToken.address,

      srcChainTokenInAmount: params.amount,

      dstChainId: mappingChainId[params.toChain] || params.toChain,
      dstChainTokenOut:
        params.toChain === 1151111081099710
          ? (params.toToken as SolanaToken).id
          : toToken.isNative
            ? ZERO_ADDRESS
            : toToken.address,

      dstChainTokenOutAmount: 'auto',

      enableEstimate: false,
      prependOperatingExpenses: false,

      referralCode: 31982,
      affiliateFeePercent: (params.feeBps * 100) / 10_000,
      affiliateFeeRecipient:
        params.fromChain === 1151111081099710
          ? CROSS_CHAIN_FEE_RECEIVER_SOLANA
          : CROSS_CHAIN_FEE_RECEIVER,
    }

    let path = 'quote'
    if (params.recipient && params.sender && params.sender !== ZERO_ADDRESS) {
      path = 'create-tx'
      p = {
        ...p,
        srcChainOrderAuthorityAddress: params.sender,
        dstChainOrderAuthorityAddress: params.recipient,
        dstChainTokenOutRecipient: params.recipient,
      }
    }

    // Convert the parameters object to URL query string
    const queryParams = new URLSearchParams()
    for (const [key, value] of Object.entries(p)) {
      queryParams.append(key, String(value))
    }

    const r = await fetch(
      `${DEBRIDGE_API}/${path}?${queryParams.toString()}`
    ).then((res) => res.json())
    if (!r.estimation) {
      throw new Error(r.errorMessage)
    }

    //const inputUsd = r.estimation.srcChainTokenIn.approximateUsdValue
    //const outputUsd = r.estimation.dstChainTokenOut.recommendedApproximateUsdValue

    const formattedInputAmount = formatUnits(
      BigInt(params.amount),
      params.fromToken.decimals
    )
    const formattedOutputAmount = formatUnits(
      BigInt(r.estimation.dstChainTokenOut.recommendedAmount),
      params.toToken.decimals
    )

    const inputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(
      params.fromChain
    )
      ? r.estimation.srcChainTokenIn.approximateUsdValue
      : params.tokenInUsd * +formattedInputAmount
    const outputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(
      params.toChain
    )
      ? r.estimation.dstChainTokenOut.recommendedApproximateUsdValue
      : params.tokenOutUsd * +formattedOutputAmount

    const fixFee = r.fixFee

    const wrappedAddress =
      NativeCurrencies[params.fromChain as ChainId].wrapped.address
    const nativePrice = await fetch(
      `${TOKEN_API_URL}/v1/public/tokens/prices`,
      {
        method: 'POST',
        body: JSON.stringify({
          [params.fromChain]: [wrappedAddress],
        }),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        return res?.data?.[params.fromChain]?.[wrappedAddress]?.PriceBuy || 0
      })

    const nativeDecimals =
      params.fromChain === 1151111081099710
        ? 9
        : NativeCurrencies[params.fromChain as ChainId].decimals
    const protocolFee =
      Number(nativePrice) * (Number(fixFee) / 10 ** nativeDecimals)
    const protocolFeeString = `${Number(fixFee) / 10 ** nativeDecimals} ${params.fromChain === 1151111081099710
      ? 'SOL'
      : NativeCurrencies[params.fromChain as ChainId].symbol
      }`

    return {
      quoteParams: params,
      outputAmount: BigInt(r.estimation.dstChainTokenOut.recommendedAmount),

      formattedOutputAmount,

      inputUsd,
      outputUsd,

      priceImpact:
        !inputUsd || !outputUsd
          ? Number.NaN
          : ((inputUsd - outputUsd) * 100) / inputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,

      gasFeeUsd: 0,
      timeEstimate: r.order.approximateFulfillmentDelay,
      contractAddress: r.tx.allowanceTarget || r.tx.to,
      rawQuote: r,

      protocolFee,
      protocolFeeString,
      platformFeePercent: (params.feeBps * 100) / 10_000,
    }
  }

  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient,
    _nearWallet?: ReturnType<typeof useWalletSelector>,
    _sendBtcFn?: (params: {
      recipient: string
      amount: string | number
    }) => Promise<string>,
    sendSolanaFn?: WalletAdapterProps['sendTransaction'],
    solanaConnection?: Connection
  ): Promise<NormalizedTxResponse> {
    if (quote.quoteParams.fromChain === 1151111081099710) {
      if (!solanaConnection || !sendSolanaFn)
        throw new Error('Connection is not defined for Solana swap')
      const txBuffer = Buffer.from(quote.rawQuote.tx.data.slice(2), 'hex')

      // Try to deserialize as VersionedTransaction first
      let transaction
      try {
        transaction = VersionedTransaction.deserialize(txBuffer)
        console.log('Parsed as VersionedTransaction')
      } catch (versionedError) {
        console.log(
          'Failed to parse as VersionedTransaction, trying legacy Transaction'
        )
        try {
          transaction = Transaction.from(txBuffer)
          console.log('Parsed as legacy Transaction')
        } catch (legacyError) {
          throw new Error(
            'Could not parse transaction as either VersionedTransaction or legacy Transaction'
          )
        }
      }

      console.log('Transaction parsed successfully:', transaction)

      // Send through wallet adapter
      const signature = await sendSolanaFn(transaction, solanaConnection)
      const waitForConfirmation = async (txId: string) => {
        try {
          const latestBlockhash = await solanaConnection.getLatestBlockhash()

          // Wait for confirmation with timeout
          const confirmation = await Promise.race([
            solanaConnection.confirmTransaction(
              {
                signature: txId,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
              },
              'confirmed'
            ),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Transaction confirmation timeout')),
                60000
              )
            ),
          ])

          const confirmationResult = confirmation as { value: { err: any } }
          if (confirmationResult.value.err) {
            throw new Error(
              `Transaction failed: ${JSON.stringify(confirmationResult.value.err)}`
            )
          }

          console.log('Transaction confirmed successfully!')
        } catch (confirmError) {
          console.error('Transaction confirmation failed:', confirmError)

          // Check if transaction actually succeeded despite timeout
          const txStatus = await solanaConnection.getSignatureStatus(txId)
          if (txStatus?.value?.confirmationStatus !== 'confirmed') {
            throw new Error(
              `Transaction was not confirmed: ${confirmError.message}`
            )
          }
        }
      }

      await waitForConfirmation(signature)

      return {
        sender: quote.quoteParams.sender,
        id: quote.rawQuote.orderId, // specific id for debridge
        sourceTxHash: signature,
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

    const account = walletClient.account?.address
    if (!account) throw new Error('WalletClient account is not defined')

    const tx = await walletClient.sendTransaction({
      chain: undefined,
      account: account as `0x${string}`,
      to: quote.rawQuote.tx.to,
      value: BigInt(quote.rawQuote.tx.value),
      data: quote.rawQuote.tx.data,
      kzg: undefined,
    })
    return {
      sender: quote.quoteParams.sender,
      id: quote.rawQuote.orderId, // specific id for each provider
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

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const r = await fetch(`${DEBRIDGE_API}/${p.id}/status`).then((res) =>
      res.json()
    )
    return {
      status: r.status === 'Fulfilled' ? 'Success' : 'Processing',
      txHash: p.id,
    }
  }
}
