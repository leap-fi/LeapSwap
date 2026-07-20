import { encodeAbiParameters, parseAbiParameters } from 'viem'
import { useServerErrorStore } from '../stores/useServerErrorStore.js'

// Type definitions (can be moved to a separate types file if needed)
interface Asset {
  address: string
  symbol: string
  decimals: number
  name: string
  icon?: string
  chainId: number
  chain?: string // e.g. 'solana'
}

interface CrossStatusParams {
  requestId: string
}

interface SwapParams {
  fromMsg: Asset
  toMsg: Asset
  inAmount: string
  slippage_tolerance: string | number
  account: string // Debridge requires account
  receiver?: string // Debridge requires receiver
}

interface BuildBridgeDataParams {
  account: string
  route: any // Needs more specific type
  toMiddlewareRoute?: any // Needs more specific type
  swapResult?: any // Needs more specific type
  receiver: string
}

interface BuildSolanaBridgeDataParams {
  account: string
  route: any // Needs more specific type
  receiver: string
}

// Define mapping between chain IDs and Debridge internal chain IDs
const DEBRIDGE_CHAIN_IDS: Record<number | string, string> = {
  1151111081099710: '7565164', // Solana
  100: '100000002', // Gnosis Chain
  42161: '42161', // Arbitrum
  43114: '43114', // Avalanche
  56: '56', // BNB Chain
  1: '1', // Ethereum
  137: '137', // Polygon
  250: '250', // Fantom
  59144: '59144', // Linea
  10: '10', // Optimism
  8453: '8453', // Base
  245022934: '100000001', // Neon
  1890: '100000003', // Lightlink (suspended)
  1088: '100000004', // Metis
  7171: '100000005', // Bitrock
  4158: '100000006', // CrossFi
  388: '100000010', // Cronos zkEVM
  1514: '100000013', // Story
  146: '100000014', // Sonic
  48900: '100000015', // Zircuit
  2741: '100000017', // Abstract
  80094: '100000020', // Berachain
  60808: '100000021', // BOB
  999: '100000022', // HyperEVM
  5000: '100000023', // Mantle
  747: '100000009', // Flow
  32769: '100000008', // Zilliqa
  14: '14', // Flare
  // Other EVM chain IDs use numeric strings directly
}

// Debridge internal uses native token addresses
const DEBRIDGE_NATIVE_ADDRESS: Record<string, string> = {
  evm: '0x0000000000000000000000000000000000000000',
  solana: '11111111111111111111111111111111', // Debridge specific representation for SOL
}

// Actual native token addresses (for isNativeToken check)
const NATIVE_TOKEN_ADDRESSES = [
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Common EVM Native Placeholder
  '0x0000000000000000000000000000000000001010', // Polygon Native Placeholder
  '0x0000000000000000000000000000000000000000', // EVM Zero Address (often used for native)
  'So11111111111111111111111111111111111111112', // Solana Native Mint Address
  '', // Empty string might be used in some cases
].map((addr) => addr.toLowerCase())

const NATIVE_TOKEN_ICONS = {
  eth: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  bnb: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  matic: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  avax: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  ftm: 'https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png',
  sol: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  flr: 'https://assets.coingecko.com/coins/images/28624/small/Flare_Networks_logo.png',
} as const

// Native token information
const NATIVE_TOKENS: Record<number, Asset> = {
  1: {
    chainId: 1,
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    icon: NATIVE_TOKEN_ICONS.eth,
  },
  56: {
    chainId: 56,
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    name: 'Binance Chain Native Token',
    symbol: 'BNB',
    decimals: 18,
    icon: NATIVE_TOKEN_ICONS.bnb,
  },
  137: {
    chainId: 137,
    address: '0x0000000000000000000000000000000000001010',
    icon: NATIVE_TOKEN_ICONS.matic,
    name: 'Matic',
    symbol: 'MATIC',
    decimals: 18,
  },
  43114: {
    chainId: 43114,
    address: '0x0000000000000000000000000000000000000000',
    name: 'Avalanche',
    symbol: 'AVAX',
    icon: NATIVE_TOKEN_ICONS.avax,
    decimals: 18,
  },
  250: {
    chainId: 250,
    address: '0x0000000000000000000000000000000000000000',
    name: 'Fantom',
    symbol: 'FTM',
    decimals: 18,
    icon: NATIVE_TOKEN_ICONS.ftm,
  },
  42161: {
    name: 'ETH',
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    decimals: 18,
    symbol: 'ETH',
    icon: NATIVE_TOKEN_ICONS.eth,
    chainId: 42161,
  },
  10: {
    name: 'Etherum',
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    decimals: 18,
    symbol: 'ETH',
    icon: NATIVE_TOKEN_ICONS.eth,
    chainId: 10,
  },
  324: {
    chainId: 324,
    name: 'Ethereum',
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    decimals: 18,
    symbol: 'ETH',
    icon: NATIVE_TOKEN_ICONS.eth,
  },
  8453: {
    chainId: 8453,
    name: 'Ethereum',
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    decimals: 18,
    symbol: 'ETH',
    icon: NATIVE_TOKEN_ICONS.eth,
  },
  7565164: {
    chainId: 7565164,
    name: 'SOL',
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    symbol: 'SOL',
    icon: NATIVE_TOKEN_ICONS.sol,
  },
  14: {
    chainId: 14,
    name: 'Flare',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    symbol: 'FLR',
    icon: NATIVE_TOKEN_ICONS.flr,
  },
}

export class DebridgeService {
  private static readonly DEBRIDGE_API_URL = 'https://api.debridge.finance' // Correct API URL
  static readonly DEBRIDGE_QUOTE_URL = 'https://deswap.debridge.finance/v1.0'
  private static readonly REFERRAL_CODE = 31824

  // Map STATUS to internal unified status code
  private static readonly STATUS_MAP: Record<string | number, string> = {
    10: '5', // success (Debridge internal)
    14: '2', // failure (Debridge internal)
    8: '3', // comfir (Debridge internal)
    DELIVERED: '5',
    FAILED: '2',
    INFLIGHT: '3', // Pending/In progress
    EXECUTED: '5', // Likely success
    CANCELLED: '2', // Failure
    PENDING: '3', // Pending
    ERROR: '2', // Failure
    // dLN/deswap statuses
    Created: '3', // Pending
    Fulfilled: '5', // Success
    SentUnlock: '3', // In progress
    ClaimedUnlock: '5', // Success (final step for receiver)
    // Common statuses from original code (might need adjustments)
    Success: '5',
    Pending: '3',
    Stucked: '3', // Consider mapping to '3' (Pending) or '2' (Failure)
    Reverted: '2',
    'Not found': '2',
    destination_executed: '5',
    error: '2',
    source_gateway_called: '3', // In progress
    2: '5', // ccip success? Needs verification
    success: '5',
  }

  /**
   * Map Debridge status code to internal unified status code
   * @param status Debridge return status string or number
   * @returns Internal status code ('2': failure, '3': pending, '5': success) or '2' (unknown/failure)
   */
  private static mapStatus(status: string | number): string {
    const mapped =
      DebridgeService.STATUS_MAP[status] ||
      DebridgeService.STATUS_MAP[String(status).toLowerCase()]
    console.log(`Mapping status: ${status} -> ${mapped || '2 (default)'}`)
    return mapped || '2' // Default to failure if unknown
  }

  /**
   * Check if address is native token address
   * @param tokenAddress Token address
   * @returns Whether it's a native token
   */
  private static isNativeToken(tokenAddress: string): boolean {
    return NATIVE_TOKEN_ADDRESSES.includes(tokenAddress.toLowerCase())
  }

  /**
   * Get native token information for specified chain
   * @param chainId Chain ID
   * @returns Native token Asset object or undefined
   */
  private static getNativeTokenInfo(chainId: number): Asset | undefined {
    return NATIVE_TOKENS[chainId]
  }

  /**
   * Get Debridge internal chain ID
   * @param chainId Original chain ID
   * @returns Debridge chain ID string
   */
  private static getDebridgeChainId(chainId: number | string): string {
    return DEBRIDGE_CHAIN_IDS[chainId] || chainId.toString()
  }

  /**
   * Get Debridge token address for specified asset
   * @param asset Token Asset object
   * @returns Debridge token address string
   */
  private static getDebridgeTokenAddress(asset: Asset): string {
    if (asset.chain === 'solana') {
      return asset.address === NATIVE_TOKENS[7565164]?.address // 'So11111111111111111111111111111111111111112'
        ? DEBRIDGE_NATIVE_ADDRESS.solana // '11111111111111111111111111111111'
        : asset.address
    } else {
      // EVM
      return DebridgeService.isNativeToken(asset.address)
        ? DEBRIDGE_NATIVE_ADDRESS.evm // '0x0000000000000000000000000000000000000000'
        : asset.address
    }
  }

  // Debridge directly get cross amount API not found, return original input value
  static async getCrossAmount(params: { amt: string }): Promise<{
    crossOutAmount: string
  }> {
    console.log('Debridge getCrossAmount called with:', params)
    // Debridge quote or order/create-tx API returns estimated output, but here needs independent API
    // Temporary unable to directly get, return input value as placeholder
    return { crossOutAmount: params.amt }
  }

  // Debridge get minSend direct API not found, return 0
  static async minSend(params: any): Promise<number> {
    console.log('Debridge minSend called with:', params)
    // Debridge documentation seems not have separate minSend API
    // Minimum value usually implicit in /quote or /order/create-tx response or error
    return 0 // Return 0 as placeholder
  }

  /**
   * Query Debridge cross-chain transaction status
   * @param params Contains requestId
   * @returns Transaction status and destination chain hash
   */
  static async getCrossStatus(
    params: CrossStatusParams
  ): Promise<{ code: number; data: { status: string; destHash?: string } }> {
    const { requestId } = params
    const url = new URL(`${DebridgeService.DEBRIDGE_API_URL}/intents/status/v2`)
    url.searchParams.append('requestId', requestId)

    try {
      const response = await fetch(url.toString())
      const data = await response.json() // Try parsing JSON even for errors
      console.log('Debridge getCrossStatus response:', data)

      if (!response.ok) {
        const error: any = new Error(`HTTP error! status: ${response.status}`)
        error.response = { status: response.status, data: data }
        throw error
      }

      const { status, txHashes, error: apiError } = data || {}

      let internalStatus = '2' // Default to failure
      if (apiError) {
        console.error('Debridge status API returned error:', apiError)
        internalStatus = '2'
      } else if (status) {
        internalStatus = DebridgeService.mapStatus(status)
      }

      const destHash = txHashes && txHashes.length > 0 ? txHashes[0] : undefined

      return {
        code: 200, // response.status should be 200 here
        data: { status: internalStatus, destHash: destHash },
      }
    } catch (error: any) {
      // Handles fetch network errors or errors thrown from !response.ok
      console.error(
        `Error fetching Debridge status for ${requestId}:`,
        error.response?.data || error.message
      )
      const errorStatus = error.response?.data?.status
      const internalStatus = errorStatus
        ? DebridgeService.mapStatus(errorStatus)
        : '2'
      const code = error.response?.status || 500
      return {
        code: code === 404 ? 404 : 500,
        data: { status: internalStatus },
      }
    }
  }

  /**
   * Get Debridge cross-chain quote (Swap U Then Cross)
   * @param params Contains source/target information, amount, slippage, etc.
   * @returns Contains object with fields needed to build Route or null (failure)
   */
  static async swapUThenCross(params: SwapParams): Promise<any | null> {
    // Return type needs more specific definition
    const { fromMsg, toMsg, inAmount, slippage_tolerance, account, receiver } =
      params

    const debridgeSrcChainId = DebridgeService.getDebridgeChainId(
      fromMsg.chainId
    )
    const debridgeDstChainId = DebridgeService.getDebridgeChainId(toMsg.chainId)
    const debridgeSrcToken = DebridgeService.getDebridgeTokenAddress(fromMsg)
    const debridgeDstToken = DebridgeService.getDebridgeTokenAddress(toMsg)

    const queryParams =
      account && receiver
        ? {
          srcChainId: debridgeSrcChainId,
          srcChainTokenIn: debridgeSrcToken,
          srcChainTokenInAmount: inAmount,
          dstChainId: debridgeDstChainId,
          dstChainTokenOut: debridgeDstToken,
          dstChainTokenOutRecipient: receiver || account,
          senderAddress: account,
          referralCode: DebridgeService.REFERRAL_CODE.toString(), // Ensure referralCode is string
          srcChainRefundAddress: account,
          srcChainOrderAuthorityAddress: account,
          dstChainOrderAuthorityAddress: receiver || account,
          enableEstimate: false,
          prependOperatingExpenses: true,
          additionalTakerRewardBps: 0,
          allowedTaker:
            debridgeDstChainId === '7565164'
              ? '2snHHreXbpJ7UwZxPe37gnUNf7Wx7wv6UKDSR2JckKuS'
              : '0x555CE236C0220695b68341bc48C68d52210cC35b',
          deBridgeApp: 'DESWAP',
          ptp: false,
          tab: new Date().getTime(),
        }
        : {
          srcChainId: debridgeSrcChainId,
          srcChainTokenIn: debridgeSrcToken,
          srcChainTokenInAmount: inAmount,
          dstChainTokenOutAmount: 'auto',
          dstChainId: debridgeDstChainId,
          dstChainTokenOut: debridgeDstToken,
          referralCode: DebridgeService.REFERRAL_CODE.toString(), // Ensure referralCode is string
          prependOperatingExpenses: true,
          additionalTakerRewardBps: 0,
          tab: new Date().getTime(),
        }

    const url = new URL(
      `${DebridgeService.DEBRIDGE_QUOTE_URL}/dln/order/create-tx`
    )
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString())
      }
    })

    try {
      console.log('Calling Debridge create-tx with url:', url.toString())
      const response = await fetch(url.toString())
      const quoteData = await response.json()
      console.log('Debridge create-tx response:', quoteData)

      if (!response.ok) {
        const error: any = new Error(`HTTP error! status: ${response.status}`)
        error.response = { status: response.status, data: quoteData }
        throw error
      }

      if (!quoteData || !quoteData.estimation || !quoteData.tx) {
        console.error('Invalid response from Debridge create-tx API', quoteData)
        return null
      }

      const { estimation, tx, orderId, fixFee, prependedOperatingExpenseCost } =
        quoteData
      const { srcChainTokenIn, dstChainTokenOut, approximateFulfillmentDelay } =
        estimation

      // Calculate minOutAmount based on slippage
      const outAmount = dstChainTokenOut?.amount
      const slippagePercent =
        Number.parseFloat(slippage_tolerance.toString()) / 100
      const minOutAmount = outAmount
        ? (
          (BigInt(outAmount) *
            BigInt(Math.floor((1 - slippagePercent) * 10000))) /
          BigInt(10000)
        ).toString()
        : '0'

      // Determine fee token (native token of source chain)
      const feeTokenInfo = DebridgeService.getNativeTokenInfo(fromMsg.chainId)
      // Use fixFee if available, otherwise default to '0'
      const feeAmount = fixFee || '0'

      let finalFeeToken = feeTokenInfo
      if (finalFeeToken) {
        // Apply address transformation rules
        let address = finalFeeToken.address.toLowerCase()
        const chainId = finalFeeToken.chainId

        if (
          chainId === 1151111081099710 &&
          address === 'so11111111111111111111111111111111111111112'
        ) {
          address = '11111111111111111111111111111111' // Debridge Solana native representation
        } else if (address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
          address = '0x0000000000000000000000000000000000000000' // Zero address representation
        }

        // Create a new object with the potentially modified address
        finalFeeToken = { ...finalFeeToken, address: address }
      }
      // Specific address for Solana, Debridge contract address for other chains
      const to =
        fromMsg.chainId === 1151111081099710
          ? 'src5qyZHqTqecJV4aY6Cb6zDZLMDzrDKKezs22MPHr4'
          : tx.to
      const data = {
        prependedOperatingExpenseCost,
        isDebridgeRoute: true, // Flag to identify the route source
        orderId: orderId,
        fromTokenUSD: srcChainTokenIn?.approximateUsdValue?.toString() || '0',
        toTokenUSD: dstChainTokenOut?.approximateUsdValue?.toString() || '0',
        outAmount: outAmount || '0',
        minOutAmount: minOutAmount,
        // Transaction details directly from tx object
        transaction: tx.data,
        to,
        value: tx.value || feeAmount || '0', // Value (often native token fee for Debridge)
        // Chain info
        chainId: fromMsg.chainId, // Source chain for the transaction
        from: account, // User's account initiates the transaction
        // Estimate details
        approveContract: to, // Approval needed for the Debridge contract
        // executionDuration: approximateFulfillmentDelay ? approximateFulfillmentDelay * 1000 : 300000, // Convert seconds to ms? Needs verification. Defaulting to 5min.
        executionDuration: 0, // Hardcoding 5min for now, Debridge delay unit unclear.
        // Fee details
        feeCosts: finalFeeToken
          ? [
            {
              name: 'Debridge Fee',
              description: 'Protocol fee charged by Debridge',
              token: finalFeeToken,
              amount: feeAmount,
              amountUSD: '0', // USD value of fee not directly available
              percentage: '0', // Percentage calculation complex
              included: false, // Assume fee is paid separately or via tx.value
            },
          ]
          : [],
        // Include potential operating expense as another fee?
        // const operatingExpense = estimation?.srcChainTokenIn?.approximateOperatingExpense;
        // if (feeToken && operatingExpense && operatingExpense !== '0') {
        //    feeCosts.push({ ... })
        // }
        estimatedGas: feeAmount, // Using Debridge fixFee as a placeholder for estimated gas display
        // Other potential fields needed by useRoutes that might be missing:
        // gasPrice: tx.gasPrice, // Not directly available in Debridge response
        // dexId: // Not applicable for Debridge
      }
      return { data };
    } catch (error: any) {
      useServerErrorStore.getState().setError(error.response?.data?.errorMessage || error.message);
      console.error(
        'Error getting Debridge quote:',
        error.response?.data || error.message
      )
      return null
    }
  }

  /**
   * Build Debridge EVM cross-chain transaction data (Completed in swapUThenCross)
   * @param params Contains account, route, receiver, etc.
   * @returns Returns transactionRequest data from swapUThenCross
   */
  static async buildBridgeData(
    params: BuildBridgeDataParams
  ): Promise<any | null> {
    // Return type needs more specific definition
    const { route, account, receiver } = params // toMiddlewareRoute, swapResult in Debridge dLN mode seems not needed
    console.log('Debridge buildBridgeData called with:', params)

    // Debridge dLN transaction data in swapUThenCross already obtained via /dln/order/create-tx
    if (route && route.bridgeRoute && route.bridgeRoute.transactionRequest) {
      const { transactionRequest, bridgeId, fees } = route.bridgeRoute
      const { fixFee } = fees?.middlewareFee || {} // Get previous calculated fee
      const bridgeRouteFromAddress = DebridgeService.getDebridgeTokenAddress(
        route.bridgeRoute.fromAsset
      )

      // Debridge dLN tx object returned by `create-tx` contains `to`, `data`, `value`
      // We need to encode it for passing to LeapSwap aggregation contract (if applicable)
      // Format: [bridgeId, feeAmount, bridgeTokenAddress, encodedBridgeData]
      // encodedBridgeData: abi.encode(['address', 'bytes'], [tx.to, tx.data])

      // Check if transactionRequest is valid
      if (
        !transactionRequest ||
        !transactionRequest.to ||
        !transactionRequest.data
      ) {
        console.error('Invalid transactionRequest in route for buildBridgeData')
        return null
      }

      try {
        // Use viem to encode Debridge target address and data ABI
        const abiParams = parseAbiParameters('address to, bytes data')
        const sendData = encodeAbiParameters(abiParams, [
          transactionRequest.to,
          transactionRequest.data,
        ])

        // Return array format expected by aggregation contract
        // Note: Here feeAmount should be Debridge fee (fixFee), need to pay with native token
        // If input token is native token, this fee will be included in msg.value;
        // If input token is ERC20, this fee needs additional handling (possibly needs aggregation contract support?)
        // LeapSwap aggregation contract might need explicit fee parameter. Here assuming fixFee.
        const feeAmount = fixFee || '0' // Use fee from quote

        console.log('Encoded sendData for Debridge:', sendData)
        console.log('Params for Aggregator:', [
          bridgeId,
          feeAmount,
          bridgeRouteFromAddress,
          sendData,
        ])

        // Return final built data, this data will be sent to LeapSwap aggregator contract
        return [bridgeId, feeAmount, bridgeRouteFromAddress, sendData]
      } catch (encodeError) {
        console.error('Error encoding Debridge transaction data:', encodeError)
        return null
      }
    } else {
      console.error(
        'Missing route or transactionRequest in buildBridgeData for Debridge'
      )
      // If no transactionRequest, try to refetch create-tx API to get
      // This needs to extract necessary information from route
      if (route?.bridgeRoute) {
        const { fromAsset, toAsset, inputAmount } = route.bridgeRoute
        if (fromAsset && toAsset && inputAmount && account && receiver) {
          console.log('Attempting to refetch Debridge transaction data...')
          const quoteResult = await DebridgeService.swapUThenCross({
            fromMsg: fromAsset,
            toMsg: toAsset,
            inAmount: inputAmount,
            slippage_tolerance: '1', // Default slippage or get from route?
            account: account,
            receiver: receiver,
          })
          if (quoteResult?.bridgeRoute?.transactionRequest) {
            const { transactionRequest, bridgeId } = quoteResult.bridgeRoute
            const fixFee = quoteResult.fees?.middlewareFee?.amount || '0'
            const bridgeRouteFromAddress =
              DebridgeService.getDebridgeTokenAddress(fromAsset)
            try {
              const abiParams = parseAbiParameters('address to, bytes data')
              const sendData = encodeAbiParameters(abiParams, [
                transactionRequest.to,
                transactionRequest.data,
              ])
              console.log('Re-encoded sendData for Debridge:', sendData)
              console.log('Params for Aggregator (refetched):', [
                bridgeId,
                fixFee,
                bridgeRouteFromAddress,
                sendData,
              ])
              return [bridgeId, fixFee, bridgeRouteFromAddress, sendData]
            } catch (encodeError) {
              console.error(
                'Error encoding refetched Debridge transaction data:',
                encodeError
              )
              return null
            }
          } else {
            console.error('Failed to refetch Debridge transaction data.')
            return null
          }
        }
      }
      return null // Return null indicating build failure
    }
  }

  /**
   * Build Debridge transaction data from Solana to EVM
   * @param params Contains account, route, receiver
   * @returns Solana transaction object { code, data: { from, to, data, value } } or null
   */
  static async buildSolanaBridgeData(
    params: BuildSolanaBridgeDataParams
  ): Promise<{
    code: number
    data: { from: string; to: string; data: string; value: string }
  } | null> {
    const { account, route, receiver } = params
    const { bridgeRoute } = route || {}
    const { fromAsset, toAsset, inputAmount, toChainId } = bridgeRoute || {}

    if (
      !fromAsset ||
      !toAsset ||
      !inputAmount ||
      !toChainId ||
      fromAsset.chainId !== 7565164
    ) {
      console.error('Invalid params for buildSolanaBridgeData', params)
      return null
    }

    const debridgeSrcChainId = DebridgeService.getDebridgeChainId(
      fromAsset.chainId
    ) // Should be '7565164'
    const debridgeDstChainId = DebridgeService.getDebridgeChainId(toChainId)
    const debridgeSrcToken = DebridgeService.getDebridgeTokenAddress(fromAsset) // Handles native SOL mapping
    const debridgeDstToken = DebridgeService.getDebridgeTokenAddress(toAsset) // Handles native EVM mapping

    const queryParams = {
      srcChainId: debridgeSrcChainId,
      srcChainTokenIn: debridgeSrcToken,
      srcChainTokenInAmount: inputAmount,
      dstChainId: debridgeDstChainId,
      dstChainTokenOut: debridgeDstToken,
      senderAddress: account,
      srcChainOrderAuthorityAddress: account,
      dstChainTokenOutRecipient: receiver,
      srcChainRefundAddress: account,
      dstChainOrderAuthorityAddress: receiver,
      referralCode: DebridgeService.REFERRAL_CODE.toString(), // Ensure referralCode is string
    }

    const url = new URL(
      `${DebridgeService.DEBRIDGE_QUOTE_URL}/dln/order/create-tx`
    )
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString())
      }
    })

    try {
      console.log(
        'Calling Debridge create-tx for Solana with url:',
        url.toString()
      )
      const response = await fetch(url.toString())
      const data = await response.json()
      console.log('Debridge create-tx (Solana) response:', data)

      if (!response.ok) {
        const error: any = new Error(`HTTP error! status: ${response.status}`)
        error.response = { status: response.status, data: data }
        throw error
      }

      if (!data?.tx) {
        console.error(
          'Invalid response from Debridge create-tx API for Solana',
          data
        )
        return null
      }
      const { tx, fixFee } = data

      let valueToSend = tx.value || '0'
      if (
        DebridgeService.isNativeToken(fromAsset.address) &&
        (!tx.value || tx.value === '0') &&
        fixFee
      ) {
        try {
          // Use BigInt for large number addition
          const totalValue = (BigInt(inputAmount) + BigInt(fixFee)).toString()
          valueToSend = totalValue
          console.warn(
            `tx.value was missing for native SOL, calculating value as inputAmount + fixFee: ${inputAmount} + ${fixFee} = ${valueToSend}`
          )
        } catch (mathError) {
          console.error(
            'Error calculating total value for Solana native send:',
            mathError
          )
          valueToSend = tx.value || '0'
        }
      } else if (
        !DebridgeService.isNativeToken(fromAsset.address) &&
        fixFee &&
        fixFee !== '0'
      ) {
        console.warn(
          `Sending SPL token but fixFee (${fixFee}) exists. This fee might need separate handling in SOL.`
        )
      }

      return {
        code: 200, // response.status should be 200 here
        data: {
          from: account,
          to: tx.to,
          data: tx.data,
          value: valueToSend,
        },
      }
    } catch (error: any) {
      console.error(
        'Error fetching Debridge Solana transaction:',
        error.response?.data || error.message
      )
      useServerErrorStore.getState().setError(error.response?.data?.errorMessage || error.message);
      return null
    }
  }
}
