import type { ChainType } from '@leapswap/widget-sdk'

export interface WalletMenuOpenOptions {
  chainType?: ChainType
}

export interface WalletMenuContext {
  isWalletMenuOpen(): void
  toggleWalletMenu(): void
  openWalletMenu(options?: WalletMenuOpenOptions): void
  closeWalletMenu(): void
}
