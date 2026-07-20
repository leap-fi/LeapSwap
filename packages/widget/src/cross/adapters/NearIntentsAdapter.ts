import { OneClickService, OpenAPI, QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript'
import { ChainId } from '@leapswap/widget-sdk'
import { Currency, SolanaToken } from '../constants/index.js'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { WalletClient, formatUnits } from 'viem'

import { BTC_DEFAULT_RECEIVER, CROSS_CHAIN_FEE_RECEIVER, SOLANA_NATIVE, ZERO_ADDRESS } from '../constants/index.js'

import { Quote } from '../registry.js'
import {
  BaseSwapAdapter,
  Chain,
  NearQuoteParams,
  NonEvmChain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
} from './BaseSwapAdapter.js'

export const MappingChainIdToBlockChain: Record<string, string> = {
  [NonEvmChain.Bitcoin]: 'btc',
  [NonEvmChain.Solana]: 'sol',
  [ChainId.ETH]: 'eth',
  [ChainId.ARB]: 'arb',
  [ChainId.BSC]: 'bsc',
  [ChainId.ERA]: 'bera',
  [ChainId.POL]: 'pol',
  [ChainId.BAS]: 'base',
  [ChainId.NEAR]: 'near',
  [ChainId.MONAD]: 'monad',
  [ChainId.FLR]: 'flr',
}
const erc20Abi = [
  {
    inputs: [
      { type: 'address', name: 'recipient' },
      { type: 'uint256', name: 'amount' },
    ],
    name: 'transfer',
    outputs: [{ type: 'bool', name: '' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

export interface NearToken {
  assetId: string
  decimals: number
  blockchain: string
  symbol: string
  price: number
  priceUpdatedAt: number
  contractAddress: string
  logo: string
}
const getTokenLogoUrl = (token: NearToken) => {
  const { symbol, contractAddress } = token

  // For major tokens without contract addresses or as fallbacks
  switch (symbol) {
    case 'ETH':
      return 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
    case 'BTC':
    case 'wBTC':
      return 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
    case 'USDC':
      return 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    case 'USDT':
      return 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    case 'DAI':
      return 'https://assets.coingecko.com/coins/images/9956/small/4943.png'
    case 'SOL':
      return 'https://assets.coingecko.com/coins/images/4128/small/solana.png'
    case 'NEAR':
    case 'wNEAR':
      return 'https://assets.coingecko.com/coins/images/10365/small/near.jpg'
    case 'BNB':
      return 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png'
    case 'DOGE':
      return 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png'
    case 'XRP':
      return 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png'
    case 'TRX':
      return 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png'
    case 'FRAX':
      return 'https://assets.coingecko.com/coins/images/13422/small/FRAX_icon.png'
    case 'LINK':
      return 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png'
    case 'UNI':
      return 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg'
    case 'AAVE':
      return 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png'
    case 'SHIB':
      return 'https://assets.coingecko.com/coins/images/11939/small/shiba.png'
    case 'PEPE':
      return 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg'
    case 'REF':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/11809.png'
    case 'AURORA':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/14803.png'
    case 'BLACKDRAGON':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/29627.png'
    // Add more cases as needed
    default:
      // Fallback to a generic token icon
      return `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x${contractAddress}/logo.png`
  }
}

export class NearIntentsAdapter extends BaseSwapAdapter {
  private nearTokens: NearToken[] = []
  constructor() {
    super()
    // Initialize the API client
    OpenAPI.BASE = 'https://1click.chaindefuser.com'
    if (this.nearTokens.length === 0) {
      this.getAllSupportedTokens()
    }
  }

  getName(): string {
    return 'Near Intents'
  }
  getIcon(): string {
    return 'https://storage.googleapis.com/ks-setting-1d682dca/000c677f-2ebc-44cc-8d76-e4c6d07627631744962669170.png'
  }
  getSupportedChains(): Chain[] {
    return [
      NonEvmChain.Solana,
      NonEvmChain.Bitcoin,
      NonEvmChain.Near,
      ...Object.keys(MappingChainIdToBlockChain).map(Number),
    ]
  }

  async getAllSupportedTokens(): Promise<void> {
    fetch(`https://1click.chaindefuser.com/v0/tokens`, {
      headers: {
        'Authorization': `Bearer ${OpenAPI.TOKEN}`,
      },
    })
      .then(res => res.json())
      .then(res => {
        const wNear = res.find((token: NearToken) => token.contractAddress === 'wrap.near')

        const native: NearToken = wNear
          ? {
            ...wNear,
            symbol: 'NEAR',
            contractAddress: '',
            assetId: 'near',
            logo: getTokenLogoUrl(wNear),
          }
          : {
            assetId: 'near',
            decimals: 24,
            blockchain: 'near',
            symbol: 'NEAR',
            price: 0,
            priceUpdatedAt: 0,
            contractAddress: '',
            logo: getTokenLogoUrl(wNear),
          }

        this.nearTokens = [
          native,
          ...(res?.map((item: NearToken) => {
            if (item.blockchain == 'btc') {
              console.log(item)
            }
            return {
              ...item,
              logo: getTokenLogoUrl(item),
            }
          }) || []),
        ]
        localStorage.setItem('nearTokens', JSON.stringify(this.nearTokens))
      })
      .catch(error => {
        console.error('Failed to fetch near tokens:', error)
        let nearTokens = localStorage.getItem('nearTokens')
        if (nearTokens) {
          this.nearTokens = JSON.parse(nearTokens)
        } else {
          this.nearTokens = []
        }
        // Reset loading state on error
      })
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: NearQuoteParams): Promise<NormalizedQuote> {
    const deadline = new Date()
    // 1 hour for Bitcoin, 20 minutes for other chains
    deadline.setSeconds(deadline.getSeconds() + (params.fromChain === NonEvmChain.Bitcoin ? 60 * 60 : 60 * 20))
    if (this.nearTokens.length === 0) {
      await this.getAllSupportedTokens()
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    let fromAssetId: any = ''
    if ((params.fromToken as any).address === 'near.near') {
      fromAssetId = 'nep141:wrap.near'
    } else {
      fromAssetId = this.nearTokens.find(token => {
        const blockchain = MappingChainIdToBlockChain[params.fromChain as ChainId]

        if (params.fromChain === 1151111081099710) {
          return (params.fromToken as SolanaToken).address === SOLANA_NATIVE
            ? token.symbol === 'SOL' && token.blockchain === 'sol'
            : token.blockchain === blockchain && token.contractAddress === (params.fromToken as any).address
        }
        if (token.blockchain === blockchain) {
          // console.log(token.symbol)
          // console.log(token.assetId)
          // console.log(token)
          if (!token.contractAddress && (params.fromToken as any).isNative && token.symbol.toLowerCase() === params.fromToken.symbol?.toLowerCase()) {
            return true
          }
          return token.contractAddress?.toLowerCase() === (params.fromToken as any).address.toLowerCase()
        } else {
          return false
        }
      })?.assetId
    }

    let toAssetId: any = ''
    if ((params.toToken as any).address === 'near.near') {
      toAssetId = 'nep141:wrap.near'
    } else {
      toAssetId = this.nearTokens.find((token: NearToken) => {
        const blockchain = MappingChainIdToBlockChain[params.toChain as ChainId]
        if (params.toChain === 1151111081099710) {
          return (params.toToken as SolanaToken).address === SOLANA_NATIVE
            ? token.symbol === 'SOL' && token.blockchain === 'sol'
            : token.blockchain === blockchain && token.contractAddress === (params.toToken as any).address
        }

        if (token.blockchain === blockchain) {
          // console.log(token.symbol)
          // console.log(token.assetId)
          // console.log(token)
          if (!token.contractAddress && (params.toToken as any).isNative && token.symbol.toLowerCase() === params.toToken.symbol?.toLowerCase()) {
            return true
          }
          return token.contractAddress?.toLowerCase() === (params.toToken as any).address.toLowerCase()
        } else {
          return false
        }
      })?.assetId
    }

    if (!fromAssetId) {
      throw new Error('not supported from token')
    }
    if (!toAssetId) {
      throw new Error('not supported to token')
    }
    // Create a quote request
    const quoteRequest: QuoteRequest = {
      dry: true,
      deadline: deadline.toISOString(),
      slippageTolerance: params.slippage,
      swapType: QuoteRequest.swapType.EXACT_INPUT,

      originAsset: fromAssetId,
      depositType: QuoteRequest.depositType.ORIGIN_CHAIN,

      destinationAsset: toAssetId,
      amount: params.amount,

      refundTo: params.sender,
      refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
      referral: 'kyberswap',

      recipient: params.recipient,
      recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
      appFees: [
        {
          recipient: CROSS_CHAIN_FEE_RECEIVER.toLowerCase(),
          fee: params.feeBps,
        },
      ],
    }

    try {
      const quote = await OneClickService.getQuote(quoteRequest)
      const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
      const rawAmountOut = Number(quote?.quote?.amountOut ?? 0)
      const amountOut = rawAmountOut / 10 ** params.toToken.decimals
      const formattedOutputAmount = amountOut.toString()
      const inputUsd = Number(quote?.quote?.amountInUsd ?? 0)
      const outputUsd = +quote.quote.amountOutUsd
      const platformFeePercent = (params.feeBps * 100) / 10_000
      const protocolFee = +quote.quote.amountInUsd * params.feeBps / 10000
      return {
        quoteParams: params,
        outputAmount: BigInt(rawAmountOut),
        formattedOutputAmount,
        inputUsd: +quote.quote.amountInUsd,
        outputUsd: +quote.quote.amountOutUsd,
        priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
        rate: +formattedOutputAmount / +formattedInputAmount,
        gasFeeUsd: 0,
        timeEstimate: quote.quote.timeEstimate || 0,
        contractAddress: ZERO_ADDRESS,
        rawQuote: quote,
        protocolFee: protocolFee,
        platformFeePercent: platformFeePercent,
      }
    } catch (error) {
      // console.log('NearIntentsAdapter getQuote error', error)
      if (error && typeof error === 'object' && 'body' in error) {
        const errorWithBody = error as { body?: { message?: string } }
        if (errorWithBody.body?.message) {
          throw new Error(errorWithBody.body.message)
        }
      }
      throw error
    }
  }

  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient,
    nearWallet?: ReturnType<typeof useWalletSelector>
  ): Promise<NormalizedTxResponse> {
    const quoteParams = {
      ...quote.rawQuote.quoteRequest,
      dry: false,
      // adjust slippage to 0,01% to accept the rate change
      slippageTolerance:
        Math.floor(quote.quoteParams.slippage * 0.9) > 1
          ? Math.floor(quote.quoteParams.slippage * 0.9)
          : quote.quoteParams.slippage,
    }
    delete quoteParams.correlationId

    const refreshedQuote = await OneClickService.getQuote(quoteParams)
    const depositAddress = refreshedQuote?.quote?.depositAddress

    if (!depositAddress) {
      throw new Error('Deposit address not found')
    }

    if (
      refreshedQuote.quoteRequest.recipient === ZERO_ADDRESS ||
      refreshedQuote.quoteRequest.refundTo === ZERO_ADDRESS ||
      refreshedQuote.quoteRequest.recipient.toLowerCase() === BTC_DEFAULT_RECEIVER ||
      refreshedQuote.quoteRequest.refundTo.toLowerCase() === BTC_DEFAULT_RECEIVER
    ) {
      throw new Error('Near Intent recipient or refundTo is ZERO ADDRESS')
    }
    if (BigInt(refreshedQuote.quote.minAmountOut) < BigInt(quote.rawQuote.quote.minAmountOut)) {
      throw new Error('Quote amount out is less than expected')
    }

    const params = {
      sender: quote.quoteParams.sender,
      id: depositAddress, // specific id for each provider
      adapter: this.getName(),
      sourceChain: quote.quoteParams.fromChain,
      targetChain: quote.quoteParams.toChain,
      inputAmount: quote.quoteParams.amount,
      outputAmount: quote.outputAmount.toString(),
      sourceToken: quote.quoteParams.fromToken,
      targetToken: quote.quoteParams.toToken,
      timestamp: new Date().getTime(),
    }

    if (quote.quoteParams.fromChain === NonEvmChain.Solana) {
      return new Promise<NormalizedTxResponse>(async (resolve, reject) => {
        // Use walletClient (adaptedWallet) from ExecuteRoute.ts
        const adaptedWallet = walletClient as any

        if (!adaptedWallet || !adaptedWallet.sendTransaction) {
          reject('Not connected or walletClient does not support sendTransaction')
          return
        }

        // Get connection from adaptedWallet (exposed by ExecuteRoute.ts)
        const connection = adaptedWallet.connection
        if (!connection) {
          reject('Connection not available from walletClient')
          return
        }

        const waitForConfirmation = async (txId: string) => {
          try {
            const latestBlockhash = await connection.getLatestBlockhash()

            // Wait for confirmation with timeout
            const confirmation = await Promise.race([
              connection.confirmTransaction(
                {
                  signature: txId,
                  blockhash: latestBlockhash.blockhash,
                  lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
                },
                'confirmed',
              ),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000),
              ),
            ])

            const confirmationResult = confirmation as { value: { err: any } }
            if (confirmationResult.value.err) {
              throw new Error(`Transaction failed: ${JSON.stringify(confirmationResult.value.err)}`)
            }

            console.log('Transaction confirmed successfully!')
          } catch (confirmError) {
            console.error('Transaction confirmation failed:', confirmError)

            // Check if transaction actually succeeded despite timeout
            const txStatus = await connection.getSignatureStatus(txId)
            if (txStatus?.value?.confirmationStatus !== 'confirmed') {
              throw new Error(`Transaction was not confirmed: ${confirmError instanceof Error ? confirmError.message : 'Unknown error'}`)
            }
          }
        }

        const fromPubkey = new PublicKey(quote.quoteParams.sender)
        const recipientPubkey = new PublicKey(depositAddress)

        const fromToken = quote.quoteParams.fromToken as SolanaToken
        if (fromToken.address === SOLANA_NATIVE) {
          // Get latest blockhash before creating transaction
          const { blockhash } = await connection.getLatestBlockhash('confirmed')
          const transaction = new Transaction({
            recentBlockhash: blockhash,
            feePayer: fromPubkey,
          }).add(
            SystemProgram.transfer({
              fromPubkey: fromPubkey,
              toPubkey: recipientPubkey,
              lamports: BigInt(quote.quoteParams.amount),
            }),
          )
          try {
            // Use adaptedWallet.sendTransaction (exposed by ExecuteRoute.ts)
            const result = await adaptedWallet.sendTransaction(transaction)
            const signature = result?.signature || result
            await waitForConfirmation(signature)

            resolve({
              ...params,
              sourceTxHash: signature,
            })
          } catch (error) {
            reject(error)
          }
        } else {
          const mintPubkey = new PublicKey(fromToken.address)
          // Get associated token addresses
          const senderTokenAddress = await getAssociatedTokenAddress(
            mintPubkey,
            fromPubkey,
            false,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          )
          const recipientTokenAddress = await getAssociatedTokenAddress(
            mintPubkey,
            recipientPubkey,
            false,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          )

          // Get latest blockhash before creating transaction
          const { blockhash } = await connection.getLatestBlockhash('confirmed')
          const transaction = new Transaction({
            recentBlockhash: blockhash,
            feePayer: fromPubkey,
          })

          try {
            // Check if recipient's token account exists
            await getAccount(connection, recipientTokenAddress)
          } catch (err) {
            // Account doesn't exist, create it
            console.log('Creating recipient token account...')
            transaction.add(
              createAssociatedTokenAccountInstruction(
                fromPubkey, // payer
                recipientTokenAddress, // associated token account
                recipientPubkey, // owner
                mintPubkey, // mint
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID,
              ),
            )
          }

          // Add transfer instruction
          transaction.add(
            createTransferInstruction(
              senderTokenAddress, // source
              recipientTokenAddress, // destination
              fromPubkey, // owner
              BigInt(quote.quoteParams.amount),
              [],
              TOKEN_PROGRAM_ID,
            ),
          )

          try {
            // Use adaptedWallet.sendTransaction (exposed by ExecuteRoute.ts)
            const result = await adaptedWallet.sendTransaction(transaction)
            const signature = result?.signature || result
            await waitForConfirmation(signature)

            resolve({
              ...params,
              sourceTxHash: signature,
            })
          } catch (error) {
            reject(error)
          }
        }
        return
      })
    }

    if (quote.quoteParams.fromChain === NonEvmChain.Bitcoin) {
      return new Promise<NormalizedTxResponse>(async (resolve, reject) => {
        if (!walletClient || !walletClient.sendTransaction) {
          reject('Not connected')
          return
        }

        try {
          const tx = await walletClient.sendTransaction({
            recipient: depositAddress,
            amount: quote.quoteParams.amount,
            chain: undefined,
            account: walletClient.account?.address as `0x${string}`,
            kzg: undefined,
          })
          await OneClickService.submitDepositTx({
            txHash: tx,
            depositAddress,
          }).catch(e => {
            console.log('NearIntents submitDepositTx failed', e)
          })
          resolve({
            ...params,
            sourceTxHash: tx,
          })
        } catch (e) {
          console.log(e)
          reject(e)
          return
        }
      })
    }

    if (quote.quoteParams.fromChain === NonEvmChain.Near) {
      return new Promise<NormalizedTxResponse>(async (resolve, reject) => {
        if (!nearWallet || !nearWallet.signedAccountId) {
          reject('Not connected')
          return
        }

        const fromToken = quote.quoteParams.fromToken as any
        const isNative = fromToken.address === 'near.near'
        const rawAmount = quote.quoteParams.amount || '0'
        const amount = String(rawAmount) // yoctoNEAR 字符串

        const transactions: {
          signerId: string
          receiverId: string
          actions: any[]
        }[] = []

        // wNEAR 合约地址（标准 wrap.near）
        const WRAP_CONTRACT_ID = 'wrap.near'

        const tokenContract = fromToken.address as string | undefined

        if (isNative) {
          // 原生 NEAR：先在 wNEAR 合约上给桥地址做 storage_deposit，再 near_deposit 包成 wNEAR，然后 ft_transfer 给桥地址
          transactions.push({
            signerId: nearWallet.signedAccountId,
            receiverId: WRAP_CONTRACT_ID,
            actions: [
              {
                // 1) storage_deposit，确保桥地址在 wNEAR 上已注册
                type: 'FunctionCall',
                params: {
                  methodName: 'storage_deposit',
                  args: {
                    account_id: depositAddress,
                    registration_only: true,
                  },
                  gas: '30000000000000',
                  deposit: '1250000000000000000000', // 0.00125 NEAR
                },
              },
              {
                // 2) near_deposit：把原生 NEAR 包成 wNEAR
                type: 'FunctionCall',
                params: {
                  methodName: 'near_deposit',
                  args: {},
                  gas: '30000000000000',
                  deposit: amount, // 使用原始 NEAR 数量（yoctoNEAR）
                },
              },
              {
                // 3) ft_transfer：将 wNEAR 发送到桥地址
                type: 'FunctionCall',
                params: {
                  methodName: 'ft_transfer',
                  args: {
                    receiver_id: depositAddress,
                    amount,
                  },
                  gas: '30000000000000',
                  deposit: '1', // NEP-141 规范要求 1 yoctoNEAR
                },
              },
            ],
          })
        } else if (tokenContract) {
          // 非原生 NEP-141 token：先在 token 合约上给桥地址做 storage_deposit，再 ft_transfer
          transactions.push({
            signerId: nearWallet.signedAccountId,
            receiverId: tokenContract,
            actions: [
              {
                type: 'FunctionCall',
                params: {
                  methodName: 'storage_deposit',
                  args: {
                    account_id: depositAddress,
                    registration_only: true,
                  },
                  gas: '30000000000000',
                  deposit: '1250000000000000000000', // 0.00125 NEAR
                },
              },
              {
                type: 'FunctionCall',
                params: {
                  methodName: 'ft_transfer',
                  args: {
                    receiver_id: depositAddress,
                    amount,
                  },
                  gas: '30000000000000',
                  deposit: '1',
                },
              },
            ],
          })
        } else {
          reject('Invalid NEAR token contract')
          return
        }

        // MyNearWallet 会跳转到网页，需要在本地记录一次
        if (nearWallet?.wallet?.id === 'my-near-wallet') {
          localStorage.setItem(
            'cross-chain-swap-my-near-wallet-tx',
            JSON.stringify({
              ...params,
              sourceTxHash: depositAddress,
            })
          )
        }

        const txResult = await nearWallet
          .signAndSendTransactions({ transactions })
          .catch((e: any) => {
            console.log('NearIntents signAndSendTransactions failed', e)
            if (nearWallet?.wallet?.id === 'my-near-wallet') reject()
            else reject(e)
          })
        let transaction: any = { hash: "" };
        if (txResult && txResult.length === 1) {
          transaction = txResult[txResult.length - 1].transaction || {};
        } else if (txResult && txResult.length > 1) {
          transaction = txResult.filter((item: any) => {
            const { actions = [] } = item && item.transaction || {};
            const _actions = actions.filter((fc: any) => {
              const { FunctionCall = {} } = fc;
              const { method_name } = FunctionCall;
              return method_name === 'ft_transfer_call';
            });
            return _actions && _actions.length > 0;
          });
          if (transaction && transaction.length) {
            transaction = transaction[0].transaction;
          } else {
            transaction = txResult[txResult.length - 1].transaction || {};
          }
        }
        const { hash } = transaction;

        resolve({
          ...params,
          sourceTxHash: hash,
        })
      })
    }

    return new Promise<NormalizedTxResponse>(async (resolve, reject) => {
      try {
        if (!walletClient || !walletClient.account) reject('Not connected')
        if (quote.quoteParams.sender === ZERO_ADDRESS || quote.quoteParams.recipient === ZERO_ADDRESS) {
          reject('Near Intent refundTo or recipient is ZERO ADDRESS')
          return
        }

        const account = walletClient.account?.address as `0x${string}`

        const fromToken = quote.quoteParams.fromToken

        const hash = await ((fromToken as any).isNative
          ? walletClient.sendTransaction({
            to: depositAddress as `0x${string}`,
            value: BigInt(quote.quoteParams.amount),
            chain: undefined,
            account,
            kzg: undefined
          })
          : walletClient.writeContract({
            address: ('contractAddress' in fromToken
              ? fromToken.contractAddress
              : (fromToken as any).address) as `0x${string}`,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [depositAddress, quote.quoteParams.amount],
            chain: undefined,
            account,
          }))
        await OneClickService.submitDepositTx({
          txHash: hash,
          depositAddress,
        }).catch(e => {
          console.log('NearIntents submitDepositTx failed', e)
        })

        resolve({
          ...params,
          sourceTxHash: hash,
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const res = await OneClickService.getExecutionStatus(p.id)

    return {
      txHash: res.swapDetails?.destinationChainTxHashes[0]?.hash || '',
      status:
        res.status === 'SUCCESS'
          ? 'Success'
          : res.status === 'FAILED'
            ? 'Failed'
            : res.status === 'REFUNDED'
              ? 'Refunded'
              : 'Processing',
    }
  }
}
