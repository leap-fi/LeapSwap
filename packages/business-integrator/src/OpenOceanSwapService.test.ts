import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OpenOceanSwapService } from './OpenOceanSwapService.js'

describe('OpenOceanSwapService', () => {
  let service: OpenOceanSwapService

  beforeEach(() => {
    service = new OpenOceanSwapService()
    vi.resetModules()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { openapi_v1: ['https://rpc.example'] } }),
      } satisfies Partial<Response>)
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws a fallback error when swap returns a non-200 business code with an empty error', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ code: 500, error: '' }),
    } satisfies Partial<Response> as Response)

    await expect(
      service.getSwapQuote({
        chain: '8453',
        inTokenAddress: '0x0000000000000000000000000000000000000001',
        inTokenSymbol: 'ETH',
        outTokenAddress: '0x0000000000000000000000000000000000000002',
        outTokenSymbol: 'USDC',
        amount: '1000000000000000000',
        account: '0x0000000000000000000000000000000000000003',
      })
    ).rejects.toThrow('Failed to fetch swap quote')
  })

  it('throws the API error message when quote returns a non-200 business code', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ code: 500, error: 'Router unavailable' }),
    } satisfies Partial<Response> as Response)

    await expect(
      service.getQuote({
        chain: '8453',
        inTokenAddress: '0x0000000000000000000000000000000000000001',
        inTokenSymbol: 'ETH',
        outTokenAddress: '0x0000000000000000000000000000000000000002',
        outTokenSymbol: 'USDC',
        amount: '1000000000000000000',
      })
    ).rejects.toThrow('Router unavailable')
  })
})
