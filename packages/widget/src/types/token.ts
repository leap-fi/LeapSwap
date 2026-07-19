import type { TokenAmount as SDKTokenAmount } from '@leapswap/widget-sdk'

export interface TokenAmount extends SDKTokenAmount {
  featured?: boolean
  popular?: boolean
}
