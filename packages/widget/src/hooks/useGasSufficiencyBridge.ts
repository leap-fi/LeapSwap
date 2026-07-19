import { useAccount } from '@leapswap/wallet-management'
import type { RouteExtended } from '@leapswap/widget-sdk'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { parseUnits } from 'viem'
import { useFieldValues } from '../stores/form/useFieldValues.js'
import { useTokenAddressBalance } from './useTokenAddressBalance.js'

const refetchInterval = 30_000

export const useGasSufficiencyBridge = (route?: RouteExtended) => {
  const [fromChainId, fromTokenAddress, fromAmount] = useFieldValues(
    'fromChain',
    'fromToken',
    'fromAmount'
  )

  let chainId = fromChainId
  let tokenAddress = fromTokenAddress
  if (route) {
    chainId = route.fromToken.chainId
    tokenAddress = route.fromToken.address
  }

  const {
    token,
    chain,
    isLoading: isTokenAddressBalanceLoading,
  } = useTokenAddressBalance(chainId, tokenAddress)

  const { account } = useAccount({ chainType: chain?.chainType })

  const { data: insufficientBridge, isLoading } = useQuery({
    queryKey: [
      'bridge-sufficiency-check',
      account.address,
      chainId,
      tokenAddress,
      route?.id ?? fromAmount,
    ] as const,
    queryFn: async ({ queryKey: [, accountAddress] }) => {
      if (!accountAddress || !token) {
        return
      }
      const parsedFromAmount = parseUnits(fromAmount, token.decimals)
      let currentTokenBalance = token.amount ?? 0n
      if (!route) {
        return false
      }

      if (route.fromChainId !== route.toChainId) {
        const prependedOperatingExpenseCost =
          (route as any).data.prependedOperatingExpenseCost || 0n
        let gas = BigInt(
          Number.parseInt(
            (1.1 * Number(prependedOperatingExpenseCost)).toString()
          )
        )
        if (chain?.nativeToken?.address === fromTokenAddress) {
          if (fromChainId === 1151111081099710) {
            gas += 15000000n + (8157120n + 4000000n + 890880n)
          } else if (fromChainId === 8453) {
            gas += 1000000000000000n + 1000000000000n
          }
        }
        if (currentTokenBalance > gas) {
          currentTokenBalance = currentTokenBalance - gas
        } else {
          currentTokenBalance = 0n
        }
        const insufficientFunds = BigInt(parsedFromAmount) > currentTokenBalance
        return insufficientFunds
      }
      return false
    },
    enabled: Boolean(account.address && token && !isTokenAddressBalanceLoading),
    refetchInterval,
    staleTime: refetchInterval,
    placeholderData: account.address ? keepPreviousData : undefined,
  })

  return {
    insufficientBridge,
    isLoading,
  }
}
