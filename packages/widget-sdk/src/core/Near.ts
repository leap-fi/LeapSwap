import { ChainType, type Token, type TokenAmount } from '@leapswap/widget-types'
import type { StepExecutorOptions, StepExecutor, SDKProvider } from './types.js'

const NEAR_RPC_URL = 'https://near.drpc.org'

const toBase64Args = (value: object): string => {
  const json = JSON.stringify(value)
  if (typeof btoa === 'function') {
    return btoa(json)
  }
  // 非浏览器环境的简单降级（一般 widget 在浏览器里运行，不会走到这里）
  // @ts-ignore
  return Buffer.from(json, 'utf-8').toString('base64')
}

async function callNearRpc(method: string, params: any): Promise<any> {
  const res = await fetch(NEAR_RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'leapswap-widget', method, params }),
  })

  if (!res.ok) {
    throw new Error(`Near RPC request failed with status ${res.status}`)
  }

  const json = await res.json()
  if (json.error) {
    throw new Error(json.error.message || 'Near RPC error')
  }
  return json.result
}

async function getNearNativeBalance(accountId: string): Promise<bigint> {
  const result = await callNearRpc('query', {
    request_type: 'view_account',
    finality: 'final',
    account_id: accountId,
  })
  // amount 是字符串，单位 yoctoNEAR
  return BigInt(result.amount || '0')
}

async function getNearFungibleTokenBalance(
  accountId: string,
  contractId: string
): Promise<bigint> {
  const argsBase64 = toBase64Args({ account_id: accountId })
  const result = await callNearRpc('query', {
    request_type: 'call_function',
    finality: 'final',
    account_id: contractId,
    method_name: 'ft_balance_of',
    args_base64: argsBase64,
  })

  // result.result 是 Uint8Array 对应的 Base64 编码结果的 bytes，需解码成字符串
  try {
    const resBytes: number[] = result.result || []
    const decoded = String.fromCharCode(...resBytes)
    const parsed = JSON.parse(decoded)
    return BigInt(parsed || '0')
  } catch {
    return 0n
  }
}

/**
 * Near Provider：提供 NVM 链的余额查询能力。
 */
export function Near(): SDKProvider {
  return {
    get type() {
      return ChainType.NVM
    },
    isAddress(address: string): boolean {
      // 简单判断：非空即可；具体校验可按需增强
      return typeof address === 'string' && address.length > 0
    },
    async resolveAddress(name: string): Promise<string | undefined> {
      // 如需支持 .near 域名解析，这里可以接 NEAR name service
      return name
    },
    async getBalance(walletAddress: string, tokens: Token[]): Promise<TokenAmount[]> {
      if (!walletAddress || !tokens.length) return []

      // 为了减少 RPC 调用，native NEAR 只查一次，其它 token 并行调用 ft_balance_of
      let nativeBalancePromise: Promise<bigint> | null = null

      const results = await Promise.all(
        tokens.map(async (token) => {
          let amount = 0n
          try {
            const isNative = !token.address || token.address === 'near.near' || token.symbol === 'NEAR'
            if (isNative) {
              if (!nativeBalancePromise) {
                nativeBalancePromise = getNearNativeBalance(walletAddress)
              }
              amount = await nativeBalancePromise
            } else {
              amount = await getNearFungibleTokenBalance(walletAddress, token.address)
            }
          } catch (e) {
            // 出错时保持 amount = 0n，避免打断其他 token 的查询
            console.warn('Failed to fetch NEAR balance for token', token.address, e)
          }

          const tokenAmount: TokenAmount = {
            ...token,
            amount,
            // NEAR 暂时不返回区块号，这里用 0 占位
            blockNumber: 0n,
          }
          return tokenAmount
        })
      )

      return results
    },
    async getStepExecutor(_options: StepExecutorOptions): Promise<StepExecutor> {
      // 当前路由执行对 NEAR 是通过外部适配器完成的，这里不提供执行器
      throw new Error('Near execution is handled externally and not via SDKProvider.')
    },
  }
}

