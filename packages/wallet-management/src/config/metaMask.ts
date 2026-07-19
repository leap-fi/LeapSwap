import type { MetaMaskParameters } from 'wagmi/connectors'
import { LeapSwapLogo } from '../icons/leapswapLogo.js'

export const defaultMetaMaskConfig: MetaMaskParameters = {
  dappMetadata: {
    name: 'LeapSwap',
    url:
      typeof window !== 'undefined'
        ? (window as any)?.location.href
        : 'https://github.com/leapswap',
    base64Icon: LeapSwapLogo,
  },
}
