import type { Chain } from '@leapswap/widget-sdk'
import { useAvailableChains } from '../hooks/useAvailableChains.js'
import { useWidgetConfig } from '../providers/WidgetProvider/WidgetProvider.js'

const sanitiseBaseUrl = (baseUrl: string) => baseUrl.trim().replace(/\/+$/, '')

export type TransactionLinkProps = { chain?: Chain | number } & (
  | {
    txHash: string
    txLink?: never
  }
  | {
    txHash?: never
    txLink: string
  }
)

export const useExplorer = () => {
  const { explorerUrls } = useWidgetConfig()
  const { getChainById } = useAvailableChains()

  const getBaseUrl = (chain: Chain) => {
    let baseUrl = explorerUrls?.[chain.id]?.[0] ??
      chain?.metamask?.blockExplorerUrls?.[0]
    if (!baseUrl && chain.blockExplorerUrl) {
      baseUrl = chain.blockExplorerUrl
    }
    return sanitiseBaseUrl(baseUrl)
  }

  const resolveChain = (chain: Chain | number) =>
    Number.isFinite(chain) ? getChainById(chain as number) : (chain as Chain)

  const getTransactionLink = ({
    txHash,
    txLink,
    chain,
  }: TransactionLinkProps) => {
    if (!txHash && txLink) {
      return txLink
    }
    if (!chain) {
      throw new Error(
        'Chain parameter is required for getting transaction link'
      )
    }
    const resolvedChain = resolveChain(chain)
    if (!resolvedChain) {
      throw new Error('Invalid chain')
    }
    return `${getBaseUrl(resolvedChain)}/tx/${txHash}`
  }

  const getAddressLink = (address: string, chain?: Chain | number) => {
    if (!chain) {
      throw new Error('Chain parameter is required for getting address link')
    }
    const resolvedChain = resolveChain(chain)
    if (!resolvedChain) {
      throw new Error('Invalid chain')
    }
    return `${getBaseUrl(resolvedChain)}/address/${address}`
  }

  return {
    getTransactionLink,
    getAddressLink,
  }
}
