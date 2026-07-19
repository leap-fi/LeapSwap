import { LocalGasStationRounded } from '@mui/icons-material'
import { HelpOutline } from '@mui/icons-material'
import type { CardProps } from '@mui/material'
import { Box, Collapse, Tooltip, Typography } from '@mui/material'
import type { RouteExtended } from '@leapswap/widget-sdk'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useChain } from '../hooks/useChain.js'
import { useGasPrice } from '../hooks/useGasPrice.js'
import { usePriceImpact } from '../hooks/usePriceImpact.js'
import { useToken } from '../hooks/useToken.js'
import { useWidgetConfig } from '../providers/WidgetProvider/WidgetProvider.js'
import { useFieldValues } from '../stores/form/useFieldValues.js'
import { isRouteDone } from '../stores/routes/utils.js'
import { useSplitSubvariantStore } from '../stores/settings/useSplitSubvariantStore.js'
import { formatTokenAmount, formatTokenPrice } from '../utils/format.js'
import { Card } from './Card/Card.js'
import { IconTypography } from './IconTypography.js'
import { TokenRate } from './TokenRate/TokenRate.js'

interface TransactionDetailsProps extends CardProps {
  route?: RouteExtended
}

export const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  route,
  ...props
}) => {
  const { t } = useTranslation()
  const { feeConfig } = useWidgetConfig()
  const [cardExpanded, setCardExpanded] = useState(true)
  const [fromChainId] = useFieldValues('fromChain')
  const [toChainId] = useFieldValues('toChain')
  const { chain } = useChain(fromChainId)
  const [state] = useSplitSubvariantStore((storeState) => [storeState.state])
  const isBradge = route ? fromChainId !== toChainId : state === 'bridge'
  const { token } = useToken(fromChainId, chain?.nativeToken?.address)
  const { gasPrice } = useGasPrice(fromChainId?.toString() || '')
  if (!route) {
    route = {
      fromAmount: '0',
      toAmount: '0',
      fromToken: {
        name: '',
        address: '',
        symbol: '',
        chainId: 1,
        decimals: 0,
        priceUSD: '0',
      },
      toToken: {
        name: '',
        address: '',
        symbol: '',
        chainId: 1,
        decimals: 0,
        priceUSD: '0',
      },
      priceImpact: '0',
      fromAmountMin: 0,
      estimatedGas: 0,
      gas: 0,
      steps: [],
    } as unknown as RouteExtended
  }
  const toggleCard = () => {
    setCardExpanded((cardExpanded) => !cardExpanded)
  }

  let gasCostUSD = 0
  const feeCosts: any = []
  const combinedFeesUSD =
    gasCostUSD + feeCosts.reduce((sum: number, fee: any) => sum + fee.costUSD, 0)
  const feeCostUSD = feeCosts.reduce((sum: number, fee: any) => sum + fee.costUSD, 0)
  const estimatedGas =
    (route as any)?.estimatedGas || (route as any)?.data?.estimatedGas
  const gasCost = (route as any)?.gas || 0

  if (token && gasPrice && estimatedGas) {
    const d = 10 ** token.decimals
    gasCostUSD =
      Number(token.priceUSD) * ((Number(gasPrice) * Number(estimatedGas)) / d)
  }
  if (token && gasCost) {
    gasCostUSD =
      Number(token.priceUSD) * Number(gasCost)
  }
  if (isBradge) {
    gasCostUSD = (route as any).feeCosts?.[0]?.amountUSD || 0
  }

  const { priceImpact } = usePriceImpact(route)

  const feeCollectionStep = route.steps[0]
    ? route.steps[0].includedSteps.find(
      (includedStep) => includedStep.tool === 'feeCollection'
    )
    : 0

  let feeAmountUSD = 0

  if (feeCollectionStep) {
    const estimatedFromAmount =
      BigInt(feeCollectionStep.estimate.fromAmount) -
      BigInt(feeCollectionStep.estimate.toAmount)

    feeAmountUSD = formatTokenPrice(
      estimatedFromAmount,
      feeCollectionStep.action.fromToken.priceUSD,
      feeCollectionStep.action.fromToken.decimals
    )
  }

  const hasGaslessSupport = 12

  const showIntegratorFeeCollectionDetails =
    (feeAmountUSD || Number.isFinite(feeConfig?.fee)) && !hasGaslessSupport

  if (!Number(route.toAmount)) {
    return null
  }

  return (
    <Card selectionColor="secondary" {...props}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1.75,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'left',
          }}
        >
          <TokenRate route={route} />
        </Box>
        <Collapse timeout={100} in={!cardExpanded} mountOnEnter>
          <Box
            onClick={toggleCard}
            // biome-ignore lint/a11y/useSemanticElements:
            role="button"
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1,
              cursor: 'pointer',
            }}
          >
            <IconTypography mr={0.5} fontSize={16}>
              <LocalGasStationRounded fontSize="inherit" />
            </IconTypography>
            <Typography
              data-value={hasGaslessSupport ? 0 : combinedFeesUSD}
              sx={{
                fontSize: 14,
                color: 'text.primary',
                fontWeight: 600,
                lineHeight: 1.429,
              }}
            >
              {hasGaslessSupport
                ? t('main.fees.free')
                : t('format.currency', { value: combinedFeesUSD })}
            </Typography>
          </Box>
        </Collapse>
        {/* <CardIconButton onClick={toggleCard} size="small">
          {cardExpanded ? (
            <ExpandLess fontSize="inherit" />
          ) : (
            <ExpandMore fontSize="inherit" />
          )}
        </CardIconButton> */}
      </Box>
      <Collapse timeout={225} in={cardExpanded} mountOnEnter>
        <Box
          sx={{
            px: 2,
            pb: 2,
          }}
        >
          {route && (isBradge || route.fromChainId !== 1151111081099710) && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 0.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <Typography variant="body2" color="text.secondary">
                  {!isBradge ? t('main.fees.network') : 'Fee'}
                </Typography>
                {isBradge ? (
                  <Tooltip
                    title="Included gas is paid on top of the amount and covers solvers gas costs to
        fulfill your trade"
                  >
                    <HelpOutline
                      sx={{
                        fontSize: '0.975rem',
                        ml: 0.5,
                        color: 'text.secondary',
                      }}
                    />
                  </Tooltip>
                ) : undefined}
              </Typography>

              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {gasCostUSD
                  ? t('format.currency', {
                    value: gasCostUSD,
                  })
                  : '--'}
              </Typography>
            </Box>
          )}
          {feeCosts.length ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 0.5,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {t('main.fees.provider')}
              </Typography>
              {feeCostUSD
                ? t('format.currency', {
                  value: feeCostUSD,
                })
                : '--'}
            </Box>
          ) : null}
          {showIntegratorFeeCollectionDetails ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 0.5,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {feeConfig?.name
                  ? t('main.fees.integrator', { tool: feeConfig.name })
                  : t('main.fees.defaultIntegrator')}
              </Typography>
              {feeConfig?.name ? (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t('format.currency', {
                    value: feeAmountUSD,
                  })}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t('format.currency', {
                    value: feeAmountUSD,
                  })}
                </Typography>
              )}
            </Box>
          ) : null}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 0.5,
            }}
          >
            <Typography
              variant="body2"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Typography variant="body2" color="text.secondary">
                {t('main.priceImpact')}
              </Typography>
              <Tooltip title="The difference between market price and est. price due to trade size">
                <HelpOutline
                  sx={{
                    fontSize: '0.975rem',
                    ml: 0.5,
                    color: 'text.secondary',
                  }}
                />
              </Tooltip>
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: priceImpact
                  ? Number(priceImpact) < 0
                    ? Number(priceImpact) > -0.3
                      ? 'orange'
                      : 'error.main'
                    : 'green'
                  : '',
              }}
            >
              {priceImpact ? t('format.percent', { value: priceImpact }) : '--'}
            </Typography>
          </Box>
          {!isBradge && (
            <Box>
              {!isRouteDone(route) ? (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {t('main.maxSlippage')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('format.percent', {
                        value: route.steps[0]?.action?.slippage ? route.steps[0].action.slippage / 100 : 0,
                      })}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {t('main.minReceived')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('format.tokenAmount', {
                        value: formatTokenAmount(
                          typeof route.toAmountMin === 'string' &&
                            !route.toAmountMin.includes('e')
                            ? BigInt(Math.floor(Number(route.toAmountMin)))
                            : BigInt(0),
                          route.toToken.decimals
                        ),
                      })}{' '}
                      {route.toToken.symbol}
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {t('main.maxSlippage')}
                    </Typography>

                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      --
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {t('main.minReceived')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      --
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>
      </Collapse>
    </Card>
  )
}
