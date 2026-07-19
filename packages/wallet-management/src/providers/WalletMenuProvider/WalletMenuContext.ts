import { createContext, useContext } from 'react'
import type {
  WalletMenuContext as _WalletMenuContext,
  WalletMenuOpenOptions,
} from './types.js'

export const WalletMenuContext = createContext<_WalletMenuContext>({
  isWalletMenuOpen: () => { },
  toggleWalletMenu: () => { },
  openWalletMenu: (_?: WalletMenuOpenOptions) => { },
  closeWalletMenu: () => { },
})

export const useWalletMenu = (): _WalletMenuContext =>
  useContext(WalletMenuContext)
