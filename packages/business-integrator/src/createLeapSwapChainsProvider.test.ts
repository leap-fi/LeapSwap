import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLeapSwapChainsProvider } from './createLeapSwapChainsProvider.js'

describe('createLeapSwapChainsProvider', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              code: 'eth',
              name: 'Ethereum',
              symbol: 'ETH',
              chainId: '1',
              icon: 'https://example.com/eth.png',
            },
          ],
        }),
      } satisfies Partial<Response>)
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches chains from the default LeapSwap API', async () => {
    const getChains = createLeapSwapChainsProvider()
    const chains = await getChains()
    expect(chains[0]?.id).toBe(1)
    expect(chains[0]?.name).toBe('Ethereum')
  })

  it('allows a full getChains override', async () => {
    const getChains = createLeapSwapChainsProvider({
      getChains: async () => [{ id: 42, name: 'Custom' } as any],
    })
    const chains = await getChains()
    expect(chains[0]?.id).toBe(42)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})
