import { FormHelperText, Skeleton, Typography } from '@mui/material'
import type { TokenAmount } from '@leapswap/widget-sdk'
import { useTranslation } from 'react-i18next'
import { useRoutes } from '../../hooks/useRoutes.js'
import { useTokenAddressBalance } from '../../hooks/useTokenAddressBalance.js'
import type { FormTypeProps } from '../../stores/form/types.js'
import { FormKeyHelper } from '../../stores/form/types.js'
import { useFieldValues } from '../../stores/form/useFieldValues.js'
import { formatTokenAmount, formatTokenPrice } from '../../utils/format.js'

export const PriceFormHelperText: React.FC<FormTypeProps> = ({ formType }) => {
  const [chainId, tokenAddress] = useFieldValues(
    FormKeyHelper.getChainKey(formType),
    FormKeyHelper.getTokenKey(formType)
  )
  const { token, isLoading } = useTokenAddressBalance(chainId, tokenAddress)

  return (
    <PriceFormHelperTextBase
      formType={formType}
      isLoading={isLoading}
      tokenAddress={tokenAddress}
      token={token}
    />
  )
}

export const PriceFormHelperTextBase: React.FC<
  FormTypeProps & {
    isLoading?: boolean
    tokenAddress?: string
    token?: TokenAmount
  }
> = ({ formType, isLoading, tokenAddress, token }) => {
  const { t } = useTranslation()
  const [amount] = useFieldValues(FormKeyHelper.getAmountKey(formType))
  const tokenAmount = token
    ? formatTokenAmount(token.amount, token.decimals)
    : '0'
  const tokenPrice = formatTokenPrice(amount, token?.priceUSD)
  let toTokenPrice
  if (formType === 'to') {
    const { routes } = useRoutes()
    if (routes) {
      const router = routes[0] || { toAmount: 0, toToken: { decimals: 18 } }
      const toAmount = formatTokenAmount(
        BigInt(router.toAmount),
        router.toToken.decimals
      )
      toTokenPrice = formatTokenPrice(toAmount, (router.toToken as any).priceUSD)
    }
  } else {
  }

  return (
    <FormHelperText
      component="div"
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        margin: 0,
        marginLeft: 2,
        marginTop: 0.75,
        textAlign: 'end',
        whiteSpace: 'nowrap',
      }}
    >
      <Typography
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          fontSize: 12,
          lineHeight: 1,
          flex: 1,
        }}
      >
        {t('format.currency', {
          value: tokenPrice || toTokenPrice || '',
        })}
      </Typography>
      {isLoading && tokenAddress ? (
        <Skeleton variant="text" width={48} height={12} />
      ) : token?.amount ? (
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: 12,
            color: 'text.secondary',
            lineHeight: 1,
            pl: 0.25,
          }}
          title={tokenAmount}
        >
          {`/ ${t('format.tokenAmount', {
            value: tokenAmount,
          })}`}
        </Typography>
      ) : null}
    </FormHelperText>
  )
}
