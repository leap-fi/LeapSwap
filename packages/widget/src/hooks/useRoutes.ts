import { useAccount } from '@leapswap/wallet-management'
import type { Route } from '@leapswap/widget-sdk'
import { ChainType, LeapSwapErrorCode } from '@leapswap/widget-sdk'
import { useWallet } from '@solana/wallet-adapter-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { parseUnits } from 'viem'
import { useConfig } from 'wagmi'
import { getWalletClient } from 'wagmi/actions'
import { getCrossChainQuote } from '../cross/crossChainQuote.js'
import { useWidgetConfig } from '../providers/WidgetProvider/WidgetProvider.js'
import { useSwapDataProvider } from './useSwapDataProvider.js'
import { useFieldValues } from '../stores/form/useFieldValues.js'
import { useSetExecutableRoute } from '../stores/routes/useSetExecutableRoute.js'
import { useSettings } from '../stores/settings/useSettings.js'
import { defaultSlippage } from '../stores/settings/useSettingsStore.js'
import { useServerErrorStore } from '../stores/useServerErrorStore.js'
import { WidgetEvent } from '../types/events.js'
import { getChainTypeFromAddress } from '../utils/chainType.js'
import { DebridgeLogo } from '../icons/debridgeLogo.js'
import { LeapSwapLogo } from '../icons/leapswapLogo.js'
import { useChain } from './useChain.js'
import { useIntegratorCacheKey } from './useIntegratorCacheKey.js'
import { useDebouncedWatch } from './useDebouncedWatch.js'
import { useGasPrice } from './useGasPrice.js'
import { useGasRefuel } from './useGasRefuel.js'
import { useIsBatchingSupported } from './useIsBatchingSupported.js'
import { useSwapOnly } from './useSwapOnly.js'
import { useToken } from './useToken.js'
import { useWidgetEvents } from './useWidgetEvents.js'

const refetchTime = 60_000

interface RoutesProps {
  observableRoute?: Route
}

export const useRoutes = ({ observableRoute }: RoutesProps = {}) => {
  const wagmiConfig = useConfig()
  const { wallet: solanaWallet } = useWallet()

  const { subvariant, sdkConfig, fee, feeConfig, referrer } = useWidgetConfig()
  const swapDataProvider = useSwapDataProvider()
  const integratorCacheKey = useIntegratorCacheKey()
  const setExecutableRoute = useSetExecutableRoute()
  const queryClient = useQueryClient()
  const emitter = useWidgetEvents()
  const swapOnly = useSwapOnly()
  const {
    disabledBridges,
    disabledExchanges,
    enabledBridges,
    enabledExchanges,
    enabledAutoRefuel,
    routePriority,
    slippage,
  } = useSettings([
    'disabledBridges',
    'disabledExchanges',
    'enabledBridges',
    'enabledExchanges',
    'enabledAutoRefuel',
    'routePriority',
    'slippage',
  ])
  const [fromTokenAmount] = useDebouncedWatch(500, 'fromAmount')
  const [
    fromChainId,
    fromTokenAddress,
    _toAddress,
    toTokenAmount,
    toChainId,
    toTokenAddress,
    contractCalls,
  ] = useFieldValues(
    'fromChain',
    'fromToken',
    'toAddress',
    'toAmount',
    'toChain',
    'toToken',
    'contractCalls'
  )
  const { token: fromToken } = useToken(fromChainId, fromTokenAddress)
  const { token: toToken } = useToken(toChainId, toTokenAddress)
  const { chain: fromChain } = useChain(fromChainId)
  const { chain: toChain } = useChain(toChainId)
  const { token: nativeToken } = useToken(
    fromChainId,
    fromChain?.nativeToken?.address
  )
  const { enabled: enabledRefuel, fromAmount: gasRecommendationFromAmount } =
    useGasRefuel()

  const { gasPrice } = useGasPrice(fromChainId?.toString() || '')
  const { account } = useAccount({ chainType: fromChain?.chainType })
  const { isBatchingSupported, isBatchingSupportedLoading } =
    useIsBatchingSupported(fromChain, account.address)

  const hasAmount = Number(fromTokenAmount) > 0 || Number(toTokenAmount) > 0

  const contractCallQuoteEnabled: boolean =
    subvariant === 'custom' ? Boolean(contractCalls && account.address) : true

  const toAddress =
    fromChainId === toChainId ||
      (fromChain?.chainType === 'EVM' && toChain?.chainType === 'EVM')
      ? account.address
      : _toAddress
  // When bridging between ecosystems, we need to ensure toAddress is set and has the same chainType as toChain
  // If toAddress is set, it must have the same chainType as toChain
  const hasToAddressAndChainTypeSatisfied: boolean =
    !!toChain &&
    !!toAddress &&
    getChainTypeFromAddress(toAddress) === toChain.chainType
  // We only need to check if toAddress is set
  const isToAddressSatisfied = toAddress
    ? hasToAddressAndChainTypeSatisfied
    : true

  const isEnabled =
    Boolean(Number(fromChain?.id)) &&
    Boolean(Number(toChain?.id)) &&
    Boolean(fromToken?.address) &&
    Boolean(toToken?.address) &&
    !Number.isNaN(slippage) &&
    hasAmount &&
    isToAddressSatisfied &&
    contractCallQuoteEnabled &&
    !isBatchingSupportedLoading

  const queryKey = [
    'routes',
    integratorCacheKey,
    account.address,
    fromChain?.id as number,
    fromToken?.address as string,
    fromTokenAmount,
    toAddress,
    toChain?.id as number,
    toToken?.address as string,
    toTokenAmount,
    contractCalls,
    slippage,
    swapOnly,
    disabledBridges,
    disabledExchanges,
    enabledBridges,
    enabledExchanges,
    routePriority,
    subvariant,
    sdkConfig?.routeOptions?.allowSwitchChain,
    enabledRefuel && enabledAutoRefuel,
    gasRecommendationFromAmount,
    feeConfig?.fee || fee,
    !!isBatchingSupported,
    observableRoute?.id,
    swapDataProvider,
  ] as const

  const { data, isLoading, isFetching, isFetched, dataUpdatedAt, refetch } =
    useQuery({
      queryKey,
      queryFn: async ({
        queryKey: [
          _,
          _integratorCacheKey,
          fromAddress,
          fromChainId,
          fromTokenAddress,
          fromTokenAmount,
          toAddress,
          toChainId,
          toTokenAddress,
          toTokenAmount,
          contractCalls,
          slippage = defaultSlippage,
          swapOnly,
          disabledBridges,
          disabledExchanges,
          allowedBridges,
          allowedExchanges,
          routePriority,
          subvariant,
          allowSwitchChain,
          enabledRefuel,
          gasRecommendationFromAmount,
          fee,
          isBatchingSupported,
          _observableRouteId,
        ],
        signal,
      }) => {
        try {
          useServerErrorStore.getState().setError(null)
          const fromAmount = parseUnits(fromTokenAmount, fromToken!.decimals)
          const formattedSlippage = slippage ? slippage : '1' // Default slippage 1%

          let quoteResult: any // Initialize quoteResult

          // Check if it's a cross-chain swap
          if (fromChainId !== toChainId) {
            // Use DebridgeService for cross-chain quotes
            if (fromToken && toToken) {
              // Construct Asset objects for DebridgeService
              const fromMsg = {
                address: fromTokenAddress,
                symbol: fromToken.symbol,
                decimals: fromToken.decimals,
                name: fromToken.name,
                icon: fromToken.logoURI,
                chainId: fromChainId,
                isNative: fromToken.isNative,
              }
              const toMsg = {
                address: toTokenAddress,
                symbol: toToken.symbol,
                decimals: toToken.decimals,
                name: toToken.name,
                icon: toToken.logoURI,
                chainId: toChainId,
                isNative: toToken.isNative,
              }

              // Get appropriate wallet client based on chain type
              let walletClient = undefined
              if (fromChain?.chainType === ChainType.EVM) {
                try {
                  walletClient = await getWalletClient(wagmiConfig)
                } catch (error) {
                  console.warn(
                    'Failed to get wallet client for EVM chain:',
                    error
                  )
                  // Continue without walletClient for non-EVM chains
                }
              } else if (fromChain?.chainType === ChainType.SVM) {
                // For Solana chains, use the Solana wallet adapter
                walletClient = solanaWallet?.adapter
              }
              quoteResult = await getCrossChainQuote({
                feeBps: 10,
                fromMsg,
                toMsg,
                inAmount: fromAmount.toString(),
                slippage_tolerance: formattedSlippage,
                account: account?.address || '',
                walletClient,
                recipient: toAddress || '',
              })

              // quoteResult = await DebridgeService.swapUThenCross({
              //   fromMsg: fromMsg,
              //   toMsg: toMsg,
              //   inAmount: fromAmount.toString(),
              //   slippage_tolerance: formattedSlippage, // Debridge might use a different format/unit
              //   account: account?.address || '',
              //   receiver: toAddress, // Assuming receiver is the same as account for now
              // })
            } else {
              console.warn(
                'Cannot get cross-chain quote: Missing fromToken or toToken.'
              )
              quoteResult = null
            }
          } else {
            // Same-chain: call generic SwapDataProvider (integrators adapt vendor APIs)
            const quoteParams = {
              chainId: fromChainId,
              fromToken: {
                address: fromTokenAddress,
                symbol: fromToken?.symbol || '',
                decimals: fromToken!.decimals,
              },
              toToken: {
                address: toTokenAddress,
                symbol: toToken?.symbol || '',
                decimals: toToken!.decimals,
              },
              amount: fromAmount.toString(),
              slippage: formattedSlippage,
              gasPrice: gasPrice ? String(gasPrice) : undefined,
              referrer: {
                address: referrer?.address,
                fee: referrer?.fee,
              },
            }

            quoteResult = account.address
              ? await swapDataProvider.getSwapQuote({
                  ...quoteParams,
                  account: account.address,
                })
              : await swapDataProvider.getQuote(quoteParams)
          }
          if (!quoteResult) {
            return []
          }

          // Both same-chain and cross-chain quotes are SwapQuoteResult-shaped.
          const quote = quoteResult as import('../types/swapDataProvider.js').SwapQuoteResult & {
            isBridge?: boolean
            error?: string
          }
          if (quote.error) {
            throw new Error(quote.error)
          }
          const isBridge = Boolean(quote.isBridge) || fromChainId !== toChainId
          const tx = quote.transaction
          const tool = quote.tool

          let toAmountMin = '0'
          if (quote.minOutAmount && Number(quote.minOutAmount) > 0) {
            toAmountMin = quote.minOutAmount
          } else if (!isBridge) {
            const amount = Number(quote.outAmount || 0)
            const slippageValue = Number.parseFloat(String(slippage))
            const minAmount = (amount * (100 - slippageValue)) / 100
            toAmountMin = minAmount.toFixed(20).replace(/\.?0+$/, '')
            if (toAmountMin.includes('e') || toAmountMin.includes('E')) {
              toAmountMin = minAmount.toLocaleString('fullwide', {
                useGrouping: false,
                maximumSignificantDigits: 21,
              })
              toAmountMin = toAmountMin.replace(/\.?0+$/, '')
            }
          }

          const outAmount = quote.outAmount || '0'
          const fromAmountUSD = quote.fromAmountUSD || '0'
          const toAmountUSD = quote.toAmountUSD || '0'

          // Build standard estimate.gasCosts — UI reads this via getAccumulatedFeeCostsBreakdown
          const gasCosts = (() => {
            if (!quote.estimatedGas || !gasPrice || !nativeToken) {
              return undefined
            }
            const estimate = String(quote.estimatedGas)
            const price = String(gasPrice)
            let amount: string
            try {
              amount = (BigInt(price) * BigInt(Math.floor(Number(estimate)))).toString()
            } catch {
              amount = String(Number(price) * Number(estimate))
            }
            const decimals = nativeToken.decimals ?? 18
            const amountUSD = String(
              Number(nativeToken.priceUSD || 0) *
                (Number(amount) / 10 ** decimals)
            )
            return [
              {
                type: 'SEND' as const,
                price,
                estimate,
                limit: estimate,
                amount,
                amountUSD,
                token: nativeToken,
              },
            ]
          })()

          const feeCosts = quote.feeCosts?.map((feeCost) => ({
            name: feeCost.name,
            description: feeCost.description || '',
            amount: feeCost.amount,
            amountUSD: feeCost.amountUSD || '0',
            percentage: feeCost.percentage || '0',
            included: feeCost.included ?? true,
            token: fromToken!,
          }))

          const route: Route = {
            id: quote.orderId || Date.now().toString(),
            fromChainId: fromChainId,
            fromAmountUSD,
            fromAmount: fromAmount.toString(),
            fromToken: fromToken!,
            fromAddress: fromAddress || '',
            toChainId: toChainId,
            toAmountUSD,
            toAmount: outAmount,
            toAmountMin,
            toToken: toToken!,
            toAddress: toAddress || '',
            insurance: {
              state: 'NOT_INSURABLE',
              feeAmountUsd: '0',
            },
            steps: [
              {
                id: '1',
                type: isBridge ? 'bridge' : 'swap',
                tool: isBridge ? 'bridge' : tool?.key || 'swap',
                transactionRequest: {
                  chainId: tx?.chainId || fromChainId,
                  from: tx?.from,
                  data: tx?.data || '0x',
                  to: tx?.to,
                  value: tx?.value || '0x0',
                  gasPrice: tx?.gasPrice,
                  type: tx?.type || tool?.key || '0x0',
                },
                toolDetails: {
                  key: tool?.key || (isBridge ? 'bridge' : 'swap'),
                  name: tool?.name || (isBridge ? 'Bridge' : 'Swap'),
                  logoURI: isBridge
                    ? tool?.logoURI || DebridgeLogo
                    : tool?.logoURI || LeapSwapLogo,
                },
                action: {
                  fromChainId: fromChainId,
                  fromAmount: fromAmount.toString(),
                  fromToken: fromToken!,
                  toChainId: toChainId,
                  toToken: toToken!,
                  slippage: Number(formattedSlippage),
                  fromAddress: fromAddress || '',
                  toAddress: toAddress || '',
                },
                estimate: {
                  fromAmount: fromAmount.toString(),
                  toAmount: outAmount,
                  toAmountMin,
                  approvalAddress:
                    quote.approvalAddress || tx?.to || '0x0',
                  executionDuration:
                    quote.executionDuration ||
                    Math.floor(Math.random() * 20) + 40,
                  tool: isBridge ? 'bridge' : tool?.key || 'swap',
                  gasCosts,
                  feeCosts,
                },
                includedSteps: [],
                // Bridge execution needs adapter key + vendor raw quote
                quoteData: isBridge ? quote.raw ?? null : null,
              },
            ],
          } as unknown as Route
          const routes = [route]
          emitter.emit(WidgetEvent.AvailableRoutes, routes)
          return routes
        } catch (error) {
          console.error('Failed to fetch routes:', error)
          useServerErrorStore.getState().setError((error as Error).message)
          return []
        }
      },
      enabled: isEnabled,
      staleTime: refetchTime,
      refetchInterval(query) {
        return Math.min(
          Math.abs(refetchTime - (Date.now() - query.state.dataUpdatedAt)),
          refetchTime
        )
      },
      retry(failureCount, error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Route query failed:', { failureCount, error })
        }
        if (failureCount >= 3) {
          return false
        }
        if (error?.code === LeapSwapErrorCode.NotFound) {
          return false
        }
        return false
      },
    })

  const setReviewableRoute = (route: Route) => {
    const queryDataKey = queryKey.toSpliced(queryKey.length - 1, 1, route.id)
    queryClient.setQueryData(
      queryDataKey,
      { routes: [route] },
      { updatedAt: dataUpdatedAt }
    )
    setExecutableRoute(route)
  }

  return {
    routes: data,
    isLoading,
    isFetching,
    isFetched,
    dataUpdatedAt,
    refetchTime,
    refetch,
    fromChain,
    toChain,
    queryKey,
    setReviewableRoute,
  }
}
