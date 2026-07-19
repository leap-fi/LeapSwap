import React from 'react';
import { Box, Typography, styled, Tooltip } from '@mui/material';
import { useRoutes } from '../../hooks/useRoutes.js'
import { formatInputAmount ,formatTokenAmount} from '../../utils/format.js'
import { InfoOutlined,HelpOutline } from '@mui/icons-material'

const SummaryBox = styled(Box)(({ theme }) => ({
  padding: '1rem',
  borderRadius: '15px',
  borderWidth: '1px',
  borderColor: theme.palette.mode === 'dark' ? '#373D3A' : 'var(--dark-background)',
  width: '100%',
  marginTop: '0.5rem',
}));

const SummaryRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '0.4rem',
  
});

export const SwapSummary: React.FC = () => {

  const {
    routes,
  } = useRoutes()
  let minReceive = '0';
  let minReceiveUsd = '0';
  let estGasFee = '0';
  let priceImpact:any = '--';
  if(routes){
    const route:any = routes[0];
    const fromAmount= +formatTokenAmount(BigInt(route.fromAmount), route.fromToken.decimals)
    const toAmount= +formatTokenAmount(BigInt(route.toAmount), route.toToken.decimals)
    const minOut= +formatTokenAmount(BigInt(route.toAmountMin), route.toToken.decimals)
    minReceive = `${Number(minOut.toFixed(4))} ${route.toToken.symbol}`
    minReceiveUsd = `~ $${Number((minOut*route.toToken.priceUSD).toFixed(2))}`

    estGasFee = route.estimatedGasFee;

    const inUsdtValue = fromAmount * route.fromToken.priceUSD;
    const outUsdtValue = toAmount * route.toToken.priceUSD;
    // priceImpact = (Math.floor(((outUsdtValue - inUsdtValue) / inUsdtValue) * 10000) / 100)
    // if (inUsdtValue < 10 && priceImpact < -50) {
    //   priceImpact = -50
    // }
    priceImpact=route.priceImpact
  }

  return (
    <SummaryBox>
      <SummaryRow>
        <Typography variant="body2" color="text.secondary" sx={{display:'flex', alignItems:'center'}}>
          <Typography component="span" color="text.secondary" sx={{fontSize:'0.875rem'}}>Minimum Receive</Typography>
        </Typography>
        <Typography variant="body2">
          <Typography component="span" color="text.secondary" sx={{fontSize:'0.875rem'}}>{minReceiveUsd}</Typography>
          <Typography component="span" sx={{fontSize:'0.875rem', ml: 1 }}>{minReceive}</Typography>
        </Typography>
      </SummaryRow>
      <SummaryRow>
        <Typography variant="body2" color="text.secondary">Est. Gas Fee</Typography>
        <Typography variant="body2">1</Typography>
      </SummaryRow>
      <SummaryRow>
        <Typography variant="body2" color="text.secondary" sx={{display:'flex', alignItems:'center'}}> 
          <Typography variant="body2" color="text.secondary">Price Impact</Typography>
          <Tooltip title="The difference between market price and est. price due to trade size">
            <HelpOutline sx={{fontSize:'0.975rem',ml: 0.5}}/>
          </Tooltip>
        </Typography>
        <Typography variant="body2">{priceImpact}</Typography>
      </SummaryRow>
    </SummaryBox>
  );
};




