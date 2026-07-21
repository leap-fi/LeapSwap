import {
  createConfig,
  ctrl,
  leather,
  okx,
  onekey,
  unisat,
  xverse,
  type Config,
  type CreateConnectorFn,
} from '@bigmi/client'
import { bitcoin, createClient, http } from '@bigmi/core'

export interface DefaultBigmiConfigProps {
  bigmiConfig?: {
    ssr?: boolean
    multiInjectedProviderDiscovery?: boolean
  }
  connectors?: CreateConnectorFn[]
  /**
   * Load Wallet SDKs only if the wallet is the most recently connected wallet
   */
  lazy?: boolean
}

export interface DefaultBigmiConfigResult {
  config: Config
  connectors: CreateConnectorFn[]
}

/**
 * Creates default Bigmi config for UTXO (Bitcoin) wallets.
 * Must stay aligned with `@bigmi/react` peer (client 0.10 / core 0.9).
 */
export function createDefaultBigmiConfig(
  props: DefaultBigmiConfigProps = {
    bigmiConfig: { multiInjectedProviderDiscovery: false },
  }
): DefaultBigmiConfigResult {
  const connectors: CreateConnectorFn[] = [
    xverse(),
    unisat(),
    ctrl(),
    okx(),
    leather(),
    onekey(),
    ...(props?.connectors ?? []),
  ]

  const config = createConfig({
    chains: [bitcoin],
    connectors,
    client({ chain }) {
      return createClient({ chain, transport: http() })
    },
    ...props?.bigmiConfig,
  })

  return {
    config,
    connectors,
  }
}
