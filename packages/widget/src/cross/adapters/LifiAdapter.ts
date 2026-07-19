import {
  ChainId,
  createConfig,
  getRoutes,
  getStatus,
  getStepTransaction,
  type LiFiStep,
  type Route,
} from '@lifi/sdk'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js'
import { WalletClient, formatUnits } from 'viem'
import * as bitcoin from 'bitcoinjs-lib'

import {
  CROSS_CHAIN_FEE_RECEIVER,
  ZERO_ADDRESS,
  Currency,
  SolanaToken,
  MAINNET_NETWORKS,
} from '../constants/index.js'

import { Quote } from '../registry.js'
import {
  BaseSwapAdapter,
  Chain,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
  NonEvmChain,
  NormalizedQuote,
  NormalizedTxResponse,
  QuoteParams,
  SwapStatus,
} from './BaseSwapAdapter.js'

const LIFI_INTEGRATOR = 'leapswap'

type LifiRawQuote = {
  route: Route
  transactionRequest?: LiFiStep['transactionRequest']
}

export class LifiAdapter extends BaseSwapAdapter {
  constructor() {
    super()
    createConfig({
      integrator: LIFI_INTEGRATOR,
    })
  }

  getName(): string {
    return 'LIFI'
  }
  getIcon(): string {
    return 'https://storage.googleapis.com/ks-setting-1d682dca/aed3a971-48be-4c3c-9597-5ab78073fbf11745552578218.png'
  }
  getSupportedChains(): Chain[] {
    return [NonEvmChain.Solana, NonEvmChain.Bitcoin, ...MAINNET_NETWORKS]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: QuoteParams): Promise<NormalizedQuote> {
    const routesRequest = this.buildRoutesRequest(params)

    const routesResponse = await getRoutes(routesRequest).catch((error) => {
      const message =
        error?.cause?.responseBody?.message ||
        error?.message ||
        'Failed to fetch LiFi routes'
      throw new Error(message)
    })

    if (!routesResponse.routes?.length) {
      const unavailableMessage = this.getUnavailableRoutesMessage(
        routesResponse.unavailableRoutes
      )
      throw new Error(
        unavailableMessage || 'No available routes for the requested transfer'
      )
    }

    const selectedRoute = this.selectBestRoute(routesResponse.routes)
    const firstStepWithTx = await this.resolveStepTransaction(
      selectedRoute.steps[0]
    )

    const formattedOutputAmount = formatUnits(
      BigInt(selectedRoute.toAmount),
      params.toToken.decimals
    )
    const formattedInputAmount = formatUnits(
      BigInt(params.amount),
      params.fromToken.decimals
    )

    const inputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(
      params.fromChain
    )
      ? Number(selectedRoute.fromAmountUSD)
      : params.tokenInUsd * +formattedInputAmount
    const outputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.toChain)
      ? Number(selectedRoute.toAmountUSD)
      : params.tokenOutUsd * +formattedOutputAmount

    const { protocolFee, gasFeeUsd } = this.aggregateRouteFees(selectedRoute)
    const timeEstimate = selectedRoute.steps.reduce(
      (acc, step) => acc + (step.estimate?.executionDuration || 0),
      0
    )

    const rawQuote: LifiRawQuote = {
      route: selectedRoute,
      transactionRequest: firstStepWithTx.transactionRequest,
    }

    return {
      quoteParams: params,
      outputAmount: BigInt(selectedRoute.toAmount),
      formattedOutputAmount,
      inputUsd,
      outputUsd,
      priceImpact:
        !inputUsd || !outputUsd
          ? NaN
          : ((inputUsd - outputUsd) * 100) / inputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd,
      timeEstimate,
      contractAddress:
        firstStepWithTx.transactionRequest?.to ||
        firstStepWithTx.estimate?.approvalAddress ||
        '',
      rawQuote,
      protocolFee,
      platformFeePercent: (params.feeBps * 100) / 10_000,
    }
  }

  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient,
    _nearWalletClient?: any,
    _sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    sendTransaction?: WalletAdapterProps['sendTransaction'],
    connection?: Connection
  ): Promise<NormalizedTxResponse> {
    const rawQuote = quote.rawQuote as LifiRawQuote
    const route = rawQuote?.route

    if (!route?.steps?.length) {
      throw new Error('LiFi route is missing or has no steps')
    }

    if (quote.quoteParams.fromChain === NonEvmChain.Bitcoin) {
      const stepWithTx = await this.resolveStepTransaction(route.steps[0])
      return this.executeBitcoinSwap(quote, stepWithTx, walletClient)
    }

    if (quote.quoteParams.fromChain === NonEvmChain.Solana) {
      const stepWithTx = await this.resolveStepTransaction(route.steps[0])
      return this.executeSolanaSwap(quote, stepWithTx, walletClient)
    }

    return this.executeEvmRoute(quote, route, walletClient)
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const res = await getStatus({
      fromChain: this.toLifiChainId(p.sourceChain),
      toChain: this.toLifiChainId(p.targetChain),
      txHash: p.sourceTxHash,
    })

    return {
      txHash: (res as any)?.receiving?.txHash || '',
      status:
        res.status === 'DONE'
          ? 'Success'
          : res.status === 'FAILED'
            ? 'Failed'
            : 'Processing',
    }
  }

  private buildRoutesRequest(params: QuoteParams) {
    const fromChainId = this.toLifiChainId(params.fromChain)
    const toChainId = this.toLifiChainId(params.toChain)
    const fromTokenAddress = this.toLifiTokenAddress(
      params.fromChain,
      params.fromToken as any
    )
    const toTokenAddress = this.toLifiTokenAddress(
      params.toChain,
      params.toToken as any
    )
    const fromAddress =
      params.sender === ZERO_ADDRESS ? CROSS_CHAIN_FEE_RECEIVER : params.sender

    return {
      fromChainId,
      fromTokenAddress,
      fromAmount: params.amount,
      toChainId,
      toTokenAddress,
      fromAddress,
      toAddress: params.recipient,
      options: {
        integrator: LIFI_INTEGRATOR,
        slippage: params.slippage / 10_000,
        fee: params.feeBps / 10_000,
        order: 'CHEAPEST' as const,
        allowSwitchChain: true,
      },
    }
  }

  private selectBestRoute(routes: Route[]): Route {
    return routes.reduce((best, route) =>
      BigInt(route.toAmount) > BigInt(best.toAmount) ? route : best
    )
  }

  private aggregateRouteFees(route: Route) {
    let protocolFee = 0
    let gasFeeUsd = Number(route.gasCostUSD || 0)

    for (const step of route.steps) {
      protocolFee +=
        step.estimate?.feeCosts?.reduce(
          (acc: number, curr: any) => acc + Number(curr.amountUSD),
          0
        ) || 0
      if (!gasFeeUsd) {
        gasFeeUsd +=
          step.estimate?.gasCosts?.reduce(
            (acc: number, curr: any) => acc + Number(curr.amountUSD),
            0
          ) || 0
      }
    }

    return { protocolFee, gasFeeUsd }
  }

  private getUnavailableRoutesMessage(unavailableRoutes: any): string | undefined {
    if (!unavailableRoutes) return undefined

    const failed = unavailableRoutes.failed
    if (Array.isArray(failed) && failed.length > 0) {
      const first = failed[0]
      if (typeof first === 'object' && first !== null) {
        const subpathErrors = Object.values(first.subpaths || {})
        const toolError = subpathErrors.find(
          (e: any) => e?.message || e?.code
        ) as any
        if (toolError?.message) return toolError.message
        if (toolError?.code) return toolError.code
        if (first.reason) return first.reason
      }
    }

    return undefined
  }

  private async resolveStepTransaction(step: LiFiStep): Promise<LiFiStep> {
    if (step.transactionRequest) {
      return step
    }
    return getStepTransaction(step)
  }

  private async executeEvmRoute(
    quote: NormalizedQuote,
    route: Route,
    walletClient: WalletClient
  ): Promise<NormalizedTxResponse> {
    const account = walletClient.account?.address
    if (!account) throw new Error('WalletClient account is not defined')

    let lastTxHash = ''

    for (const step of route.steps) {
      const stepWithTx = await this.resolveStepTransaction(step)
      const { transactionRequest } = stepWithTx
      if (!transactionRequest?.to) {
        continue
      }

      lastTxHash = await walletClient.sendTransaction({
        chain: undefined,
        account,
        to: transactionRequest.to as `0x${string}`,
        value: BigInt(transactionRequest.value || '0'),
        data: (transactionRequest.data as `0x${string}`) || '0x',
        kzg: undefined,
      })
    }

    if (!lastTxHash) {
      throw new Error('No LiFi EVM transaction was generated')
    }

    return {
      sender: quote.quoteParams.sender,
      id: lastTxHash,
      sourceTxHash: lastTxHash,
      adapter: this.getName(),
      sourceChain: quote.quoteParams.fromChain,
      targetChain: quote.quoteParams.toChain,
      inputAmount: quote.quoteParams.amount,
      outputAmount: quote.outputAmount.toString(),
      sourceToken: quote.quoteParams.fromToken,
      targetToken: quote.quoteParams.toToken,
      timestamp: Date.now(),
    }
  }

  private async executeSolanaSwap(
    quote: NormalizedQuote,
    step: LiFiStep,
    walletClient: WalletClient
  ): Promise<NormalizedTxResponse> {
    if (!walletClient.sendTransaction) {
      throw new Error('Connection is not defined for Solana swap')
    }
    if (!step.transactionRequest?.data) {
      throw new Error('LiFi Solana transaction data is missing')
    }

    const txBuffer = Buffer.from(step.transactionRequest.data, 'base64')

    let transaction
    try {
      transaction = VersionedTransaction.deserialize(txBuffer)
    } catch {
      transaction = Transaction.from(txBuffer)
    }

    const tx: any = await (walletClient as any).sendTransaction(transaction)
    const signature = tx.signature

    return {
      sender: quote.quoteParams.sender,
      id: signature,
      sourceTxHash: signature,
      adapter: this.getName(),
      sourceChain: quote.quoteParams.fromChain,
      targetChain: quote.quoteParams.toChain,
      inputAmount: quote.quoteParams.amount,
      outputAmount: quote.outputAmount.toString(),
      sourceToken: quote.quoteParams.fromToken,
      targetToken: quote.quoteParams.toToken,
      timestamp: Date.now(),
    }
  }

  private async executeBitcoinSwap(
    quote: NormalizedQuote,
    step: LiFiStep,
    walletClient: WalletClient
  ): Promise<NormalizedTxResponse> {
    const account =
      (walletClient as any).account?.address || quote.quoteParams.sender
    if (!account) throw new Error('WalletClient account is not defined')

    const transactionRequest = step.transactionRequest
    if (!transactionRequest?.data) {
      throw new Error('TransactionRequest data is missing')
    }

    let psbt: bitcoin.Psbt
    try {
      psbt = bitcoin.Psbt.fromBase64(transactionRequest.data, {
        network: bitcoin.networks.bitcoin,
      })
    } catch {
      psbt = bitcoin.Psbt.fromHex(transactionRequest.data, {
        network: bitcoin.networks.bitcoin,
      })
    }

    const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined
    let connectorName: string | undefined
    if (anyWindow?.okxwallet?.bitcoin) connectorName = 'OKX Wallet'
    else if (anyWindow?.unisat) connectorName = 'Unisat'
    else if (anyWindow?.BitcoinProvider) connectorName = 'Xverse'
    else if (anyWindow?.phantom?.bitcoin) connectorName = 'Phantom'
    else throw new Error('No Bitcoin wallet found')

    const inputsToSign: any[] = []
    for (let index = 0; index < psbt.data.inputs.length; index++) {
      const input = psbt.data.inputs[index]
      let inputAddress: string

      if (input.witnessUtxo) {
        inputAddress = bitcoin.address.fromOutputScript(
          input.witnessUtxo.script,
          bitcoin.networks.bitcoin
        )
      } else if (input.nonWitnessUtxo) {
        inputAddress = account.toString()
      } else {
        inputAddress = account.toString()
      }

      if (inputAddress === account.toString()) {
        inputsToSign.push({ index, address: inputAddress })
      }
    }

    if (inputsToSign.length === 0) {
      throw new Error('No inputs found to sign')
    }

    const psbtBase64 = psbt.toBase64()
    const psbtHex = psbt.toHex()
    let signedPsbtBase64: string

    switch (connectorName) {
      case 'OKX Wallet': {
        const response = await anyWindow.okxwallet.bitcoin.signPsbt(psbtHex, {
          autoFinalized: false,
          toSignInputs: inputsToSign.map((item) => ({
            index: item.index,
            address: item.address,
            sighashTypes: [1],
          })),
        })
        signedPsbtBase64 = this.convertHexToBase64(
          this.extractSignedPsbt(response) || ''
        )
        break
      }
      case 'Unisat': {
        const response = await anyWindow.unisat.signPsbt(psbtHex, {
          autoFinalized: false,
          toSignInputs: inputsToSign.map((item) => ({
            index: item.index,
            address: item.address,
            sighashTypes: [1],
          })),
        })
        signedPsbtBase64 = this.convertHexToBase64(
          this.extractSignedPsbt(response) || ''
        )
        break
      }
      case 'Xverse': {
        const response = await anyWindow.BitcoinProvider.request('signPsbt', {
          psbt: psbtHex,
          finalize: false,
          toSignInputs: inputsToSign.map((item) => ({
            index: item.index,
            address: item.address,
          })),
        })
        signedPsbtBase64 = this.extractSignedPsbt(response) || ''
        break
      }
      case 'Phantom': {
        const phantom = anyWindow.phantom.bitcoin
        if (!phantom?.signPSBT) {
          throw new Error('Phantom wallet does not support signPSBT')
        }
        const response = await phantom.signPSBT(psbtBase64, {
          autoFinalize: false,
          inputsToSign: inputsToSign.map((item) => ({
            index: item.index,
            address: item.address,
            sighashTypes: [1],
          })),
        })
        signedPsbtBase64 = this.extractSignedPsbt(response) || ''
        break
      }
      default:
        throw new Error(`Unsupported wallet: ${connectorName}`)
    }

    if (!signedPsbtBase64) {
      throw new Error('Failed to sign PSBT')
    }

    const signedPsbt = bitcoin.Psbt.fromBase64(signedPsbtBase64, {
      network: bitcoin.networks.bitcoin,
    })
    signedPsbt.finalizeAllInputs()
    const rawTx = signedPsbt.extractTransaction().toHex()

    const txHash = await fetch('https://mempool.space/api/tx', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: rawTx,
    }).then((r) => r.text())

    if (!txHash || txHash.startsWith('<')) {
      throw new Error(`Failed to broadcast transaction: ${txHash}`)
    }

    return {
      sender: quote.quoteParams.sender,
      id: txHash,
      sourceTxHash: txHash,
      adapter: this.getName(),
      sourceChain: quote.quoteParams.fromChain,
      targetChain: quote.quoteParams.toChain,
      inputAmount: quote.quoteParams.amount,
      outputAmount: quote.outputAmount.toString(),
      sourceToken: quote.quoteParams.fromToken,
      targetToken: quote.quoteParams.toToken,
      timestamp: Date.now(),
    }
  }

  private toLifiChainId(chain: Chain): number {
    if (chain === NonEvmChain.Solana) return ChainId.SOL
    if (chain === NonEvmChain.Bitcoin) return ChainId.BTC
    return Number(chain)
  }

  private toLifiTokenAddress(chain: Chain, token: any): string {
    if (chain === NonEvmChain.Solana || chain === NonEvmChain.Bitcoin) {
      return token.address
    }
    return token.isNative ? ZERO_ADDRESS : token.address
  }

  private convertHexToBase64(hexString: string): string {
    try {
      return Buffer.from(hexString, 'hex').toString('base64')
    } catch {
      return hexString
    }
  }

  private extractSignedPsbt(response: any): string | null {
    if (!response) return null
    if (typeof response === 'string') return response
    return (
      response.signedPsbtHex ||
      response.signedPsbtBase64 ||
      response.signedPsbt ||
      null
    )
  }
}
