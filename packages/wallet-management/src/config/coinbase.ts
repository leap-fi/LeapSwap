import type { CoinbaseWalletParameters } from 'wagmi/connectors'
import { LeapSwapLogo } from '../icons/leapswapLogo.js'

export const defaultCoinbaseConfig: CoinbaseWalletParameters = {
  appName: 'LeapSwap',
  appLogoUrl: LeapSwapLogo,
}
