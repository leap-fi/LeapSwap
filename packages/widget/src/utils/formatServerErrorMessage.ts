import type { GetChainById } from '../hooks/useAvailableChains.js'

const CHAIN_LABEL_IN_ERROR_REGEX =
  /\b(Destination|Origin|Source) chain (\d+)\b/gi

export const formatServerErrorMessage = (
  message: string | null | undefined,
  getChainById: GetChainById
): string | null | undefined => {
  if (!message) {
    return message
  }

  return message.replace(
    CHAIN_LABEL_IN_ERROR_REGEX,
    (_match, label: string, chainId: string) => {
      const chain = getChainById(Number(chainId))
      const chainName = chain?.name ?? chainId
      return `${label} chain ${chainName}`
    }
  )
}
