import {
  ankr,
  bitcoin,
  blockchair,
  blockcypher,
  createClient,
  fallback,
  mempool,
  publicActions,
  type Client,
  type PublicActions,
} from '@bigmi/core'
import { ChainId } from '@leapswap/widget-types'

export type UTXOPublicClient = Client & PublicActions

/** Cached by LeapSwap numeric chain id (BTC uses a synthetic id). */
const publicClients: Partial<Record<number, UTXOPublicClient>> = {}

/**
 * Public Bitcoin client (Bigmi 0.9+).
 * LeapSwap `ChainId.BTC` is a synthetic number; the client always targets Bitcoin mainnet.
 */
export const getUTXOPublicClient = async (
  chainId: number = ChainId.BTC
): Promise<UTXOPublicClient> => {
  const cached = publicClients[chainId]
  if (cached) {
    return cached
  }

  const client = createClient({
    chain: bitcoin,
    transport: fallback([
      blockchair(),
      blockcypher(),
      mempool(),
      ankr(),
    ]),
    pollingInterval: 10_000,
  }).extend(publicActions)

  publicClients[chainId] = client
  return client
}
