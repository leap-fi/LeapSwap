import { isUTXOAddress } from '@bigmi/core'
import { ChainId, ChainType, isSVMAddress } from '@leapswap/widget-sdk'
import { isAddress as isEVMAddress } from 'viem'

const isNearAddress = (address: string) => {
  if (!address) {
    return false
  }

  // Implicit accounts are 64-char hex strings
  const isImplicitAccount = /^[0-9a-f]{64}$/i.test(address)
  if (isImplicitAccount) {
    return true
  }

  // Named accounts must be lowercase and end with a TLD (e.g. .near, .testnet, custom subdomain)
  const isNamedAccount =
    /^[a-z0-9_-]+(\.[a-z0-9_-]+)*(\.near|\.testnet|\.chain|\.btc)?$/.test(
      address
    )
  return isNamedAccount
}

const chainTypeAddressValidation: Record<
  ChainType,
  (address: string) => boolean
> = {
  [ChainType.EVM]: isEVMAddress,
  [ChainType.SVM]: isSVMAddress,
  [ChainType.UTXO]: isUTXOAddress,
  [ChainType.MVM]: () => false,
  [ChainType.NVM]: isNearAddress,
}

export const getChainTypeFromAddress = (
  address: string
): ChainType | undefined => {
  for (const chainType in chainTypeAddressValidation) {
    const isChainType =
      chainTypeAddressValidation[chainType as ChainType](address)
    if (isChainType) {
      return chainType as ChainType
    }
  }
}

export const defaultChainIdsByType = {
  [ChainType.EVM]: ChainId.ETH,
  [ChainType.SVM]: ChainId.SOL,
  [ChainType.UTXO]: ChainId.BTC,
  [ChainType.MVM]: ChainId.SUI,
  [ChainType.NVM]: ChainId.NEAR,
}
