import { InputAdornment } from '@mui/material'
import { CircularProgress } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatUnits } from 'viem'
import { useAvailableChains } from '../../hooks/useAvailableChains.js'
import { useGasRecommendation } from '../../hooks/useGasRecommendation.js'
import { useRoutes } from '../../hooks/useRoutes.js'
import { useTokenAddressBalance } from '../../hooks/useTokenAddressBalance.js'
import { DebridgeService } from '../../services/DebridgeService.js'
import type { FormTypeProps } from '../../stores/form/types.js'
import { FormKeyHelper } from '../../stores/form/types.js'
import { useFieldActions } from '../../stores/form/useFieldActions.js'
import { useFieldValues } from '../../stores/form/useFieldValues.js'
import { useSplitSubvariantStore } from '../../stores/settings/useSplitSubvariantStore.js'
import { MaxButton, MaxButtonSkeleton } from './AmountInputAdornment.style.js'

export const AmountInputEndAdornment = ({ formType }: FormTypeProps) => {
  const { t } = useTranslation()
  const { getChainById } = useAvailableChains()
  const { setFieldValue } = useFieldActions()
  const [isMaxLoading, setIsMaxLoading] = useState(false)

  const [fromChainId, fromTokenAddress] = useFieldValues(
    FormKeyHelper.getChainKey(formType),
    FormKeyHelper.getTokenKey(formType)
  )
  const [toChainId, toTokenAddress] = useFieldValues(
    FormKeyHelper.getChainKey('to'),
    FormKeyHelper.getTokenKey('to')
  )

  const { token, isLoading } = useTokenAddressBalance(
    fromChainId,
    fromTokenAddress
  )
  // We get gas recommendations for the source chain to make sure that after pressing the Max button
  // the user will have enough funds remaining to cover gas costs
  const { data } = useGasRecommendation(fromChainId)

  const [state] = useSplitSubvariantStore((storeState) => [storeState.state])

  const { routes } = useRoutes()

  const {
    data: prependedOperatingExpenseCostOne,
    isLoading: isLoadingPrependedOperatingExpenseCost,
  } = useQuery({
    queryKey: [
      'get-prepended-operating-expense-cost',
      fromChainId,
      fromTokenAddress,
      toChainId,
      toTokenAddress,
    ] as const,
    queryFn: async () => {
      if (
        !(
          fromChainId &&
          fromTokenAddress &&
          toChainId &&
          toTokenAddress &&
          toChainId !== fromChainId
        )
      ) {
        return 0n
      }
      if(!token){
        return 0n
      }
      let srcChainTokenInAmount: any = token.amount || 0
      const asUsd =
        Number(token.priceUSD) * (Number(token.amount) / 10 ** token.decimals)
      if (asUsd < 5) {
        srcChainTokenInAmount = BigInt(
          Number.parseInt(
            (5 / Number(token.priceUSD)) * 10 ** token.decimals + ''
          )
        )
      }
      // const prependedOperatingExpenseCost = await getCost({
      //   srcChainId: fromChainId === 1151111081099710 ? 7565164 : fromChainId,
      //   srcChainTokenIn: fromTokenAddress,
      //   srcChainTokenInAmount: srcChainTokenInAmount,
      //   dstChainTokenOutAmount: 'auto',
      //   dstChainId: toChainId === 1151111081099710 ? 7565164 : toChainId,
      //   dstChainTokenOut: toTokenAddress,
      //   prependOperatingExpenses: true,
      //   additionalTakerRewardBps: 0,
      //   tab: new Date().getTime(),
      // })
      return 0n
    },
  })
  const prependedOperatingExpenseCost = prependedOperatingExpenseCostOne || 0

  const handleMax = async () => {
    if (!token?.amount) {
      return
    }

    const chain = getChainById(fromChainId)
    let maxAmount = token.amount
    let gas = 0n
    if (
      state === 'bridge' &&
      fromChainId !== toChainId &&
      fromTokenAddress &&
      toTokenAddress
    ) {
      // if(fromChainId === 20000000000001) {
      //   gas = 22000n
      // }
      // if (routes) {
      //   const router: any = routes[0] || {
      //     toAmount: 0,
      //     toToken: { decimals: 18 },
      //   }
      //   if (
      //     router &&
      //     router.data &&
      //     router.data.prependedOperatingExpenseCost
      //   ) {
      //     prependedOperatingExpenseCost =
      //       router.data.prependedOperatingExpenseCost
      //   }
      // }

      // gas = BigInt(
      //   Number.parseInt(
      //     (1.15 * Number(prependedOperatingExpenseCost)).toString()
      //   )
      // )
      // if (chain?.nativeToken?.address === fromTokenAddress) {
      //   if (fromChainId === 1151111081099710) {
      //     gas += 15000000n + (8157120n + 4000000n + 890880n)
      //   } else if (fromChainId === 8453) {
      //     gas += 1000000000000000n + 1000000000000n
      //   }
      // }
    }

    if (state === 'swap' || fromChainId === toChainId) {
      if (
        chain?.nativeToken?.address === fromTokenAddress &&
        data?.recommended
      ) {
        gas = BigInt(data.recommended.amount) / 2n
      }
    }
    if (token.amount > gas) {
      maxAmount = maxAmount - gas
    } else {
      maxAmount = 0n
    }

    if (maxAmount) {
      setFieldValue(
        FormKeyHelper.getAmountKey(formType),
        formatUnits(maxAmount, token.decimals),
        {
          isTouched: true,
        }
      )
    } else {
      setFieldValue(FormKeyHelper.getAmountKey(formType), '', {
        isTouched: true,
      })
    }
  }

  return (
    <InputAdornment position="end">
      {isLoading && fromTokenAddress ? (
        <MaxButtonSkeleton variant="rectangular" />
      ) : formType === 'from' && token?.amount ? (
        <MaxButton
          onClick={handleMax}
          disabled={isMaxLoading}
          startIcon={
            isMaxLoading ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          {t('button.max')}
        </MaxButton>
      ) : null}
    </InputAdornment>
  )
}

async function getCost(params: any) {
  const url = new URL(
    `${DebridgeService.DEBRIDGE_QUOTE_URL}/dln/order/create-tx`
  )
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString())
    }
  })

  try {
    const response = await fetch(url.toString())
    const data = await response.json()
    return data.prependedOperatingExpenseCost || 0n
  } catch (error) {
    console.error('getCost error', error)
    return 0n
  }
}
