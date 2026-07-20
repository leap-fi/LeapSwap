import {
  OPEN_OCEAN_API_V3,
  OPEN_OCEAN_API_V4,
  OPEN_OCEAN_NEAR_API,
} from './openOceanEndpoints.js'

interface OpenOceanToken {
  address: string
  symbol: string
  decimals: number
  name: string
  icon?: string
  usd?: string
  chainId?: number
}

export interface OpenOceanSwapServiceConfig {
  /** Same-chain swap referrer address (OpenOcean-compatible APIs). */
  defaultReferrer?: string
}

export class OpenOceanSwapService {
  private readonly apiV3Url = OPEN_OCEAN_API_V3
  private readonly apiV4Url = OPEN_OCEAN_API_V4
  private readonly nearApiUrl = OPEN_OCEAN_NEAR_API
  private readonly defaultReferrer: string
  private solanaRpcUrl = ''

  private static readonly CHAIN_ID_MAP: Record<string | number, string> = {
    1151111081099710: 'solana',
    20000000000001: 'bitcoin',
    20000000000006: 'near',
  }

  constructor(config: OpenOceanSwapServiceConfig = {}) {
    this.defaultReferrer =
      config.defaultReferrer ?? '0x3487ef9f9b36547e43268b8f0e2349a226c70b53'
  }

  private getChainName(chainId: string | number): string {
    return OpenOceanSwapService.CHAIN_ID_MAP[chainId] || chainId.toString()
  }

  private getApiUrl(chainId: string | number): string {
    const chainName = this.getChainName(chainId)
    return Object.keys(OpenOceanSwapService.CHAIN_ID_MAP).includes(chainId.toString())
      ? `${this.apiV4Url}/${chainName}`
      : `${this.apiV4Url}/${chainId}`
  }

  private getSolanaAddress(chain: string, tokenAddress: string): string {
    if (
      chain === '1151111081099710' &&
      tokenAddress === 'So11111111111111111111111111111111111111112'
    ) {
      return '11111111111111111111111111111111'
    }
    if (
      chain === '1151111081099710' &&
      tokenAddress === '11111111111111111111111111111111'
    ) {
      return 'So11111111111111111111111111111111111111112'
    }
    return tokenAddress
  }

  private async parseApiResponse(
    response: Response,
    fallbackMessage: string
  ) {
    const data = await response.json()

    if (!response.ok) {
      const message =
        (typeof data?.error === 'string' && data.error.trim()) ||
        (typeof data?.message === 'string' && data.message.trim()) ||
        fallbackMessage
      throw new Error(message)
    }

    if (data?.code !== undefined && data.code !== 200) {
      const message =
        (typeof data?.error === 'string' && data.error.trim()) ||
        (typeof data?.message === 'string' && data.message.trim()) ||
        fallbackMessage
      throw new Error(message)
    }

    return data
  }

  async getQuote(params: {
    chain: string
    inTokenAddress: string
    inTokenSymbol: string
    outTokenAddress: string
    outTokenSymbol: string
    amount: string
    slippage?: string
    gasPrice?: string
    disabledDexIds?: string
    enabledDexIds?: string
    referrer?: string
    account?: string
    inTokenDecimals?: number
    outTokenDecimals?: number
  }) {
    const isNearChain =
      params.chain === '20000000000006' || params.chain === 'near'

    if (isNearChain) {
      let amountAll = ''
      if (params.inTokenDecimals !== undefined) {
        const amountBigInt = BigInt(params.amount)
        const decimals = BigInt(10 ** params.inTokenDecimals)
        const wholePart = amountBigInt / decimals
        const fractionalPart = amountBigInt % decimals
        if (fractionalPart === 0n) {
          amountAll = wholePart.toString()
        } else {
          const fractionalStr = fractionalPart
            .toString()
            .padStart(params.inTokenDecimals, '0')
          const trimmedFractional = fractionalStr.replace(/0+$/, '') || '0'
          amountAll = `${wholePart}.${trimmedFractional}`
        }
      }

      const slippagePercent = params.slippage
        ? Math.floor(Number(params.slippage) * 100).toString()
        : '100'

      const queryParams = new URLSearchParams({
        quoteType: 'swap',
        inTokenSymbol: params.inTokenSymbol,
        inTokenAddress: params.inTokenAddress,
        outTokenSymbol: params.outTokenSymbol,
        outTokenAddress: params.outTokenAddress,
        amount: params.amount,
        ...(amountAll && { amountAll }),
        slippage: slippagePercent,
        gasPrice: params.gasPrice || '5000000000',
        referrer: params.referrer || this.defaultReferrer,
        disabledDexIds: params.disabledDexIds || '',
        disableRfq: '',
        ...(params.account && { account: params.account }),
      })
      const response = await fetch(
        `${this.nearApiUrl}/quote?${queryParams.toString()}`
      )
      const data = await this.parseApiResponse(
        response,
        'Failed to fetch quote'
      )
      return {
        data,
      }
    }

    const apiUrl = this.getApiUrl(params.chain)
    const slippage = Number(params.slippage || 0.01).toString()

    const queryParams = new URLSearchParams({
      quoteType: 'quote',
      inTokenSymbol: params.inTokenSymbol,
      inTokenAddress: this.getSolanaAddress(
        params.chain,
        params.inTokenAddress
      ),
      outTokenSymbol: params.outTokenSymbol,
      outTokenAddress: this.getSolanaAddress(
        params.chain,
        params.outTokenAddress
      ),
      amountDecimals: params.amount,
      slippage,
      gasPriceDecimals: params.gasPrice || '',
      disabledDexIds: params.disabledDexIds || '',
      enabledDexIds: params.enabledDexIds || '',
      referrer: params.referrer || this.defaultReferrer,
    })
    const response = await fetch(`${apiUrl}/quote?${queryParams.toString()}`)
    return this.parseApiResponse(response, 'Failed to fetch quote')
  }

  async getSwapQuote(params: {
    chain: string
    inTokenAddress: string
    inTokenSymbol: string
    outTokenAddress: string
    outTokenSymbol: string
    amount: string
    account: string
    slippage?: string
    gasPrice?: string
    disabledDexIds?: string
    enabledDexIds?: string
    referrer?: string
    referrerFee?: string
    referrerFeeShare?: string
    inTokenDecimals?: number
  }) {
    const isNearChain =
      params.chain === '20000000000006' || params.chain === 'near'

    if (isNearChain) {
      let amountAll = ''
      if (params.inTokenDecimals !== undefined) {
        const amountBigInt = BigInt(params.amount)
        const decimals = BigInt(10 ** params.inTokenDecimals)
        const wholePart = amountBigInt / decimals
        const fractionalPart = amountBigInt % decimals
        if (fractionalPart === 0n) {
          amountAll = wholePart.toString()
        } else {
          const fractionalStr = fractionalPart
            .toString()
            .padStart(params.inTokenDecimals, '0')
          const trimmedFractional = fractionalStr.replace(/0+$/, '') || '0'
          amountAll = `${wholePart}.${trimmedFractional}`
        }
      }

      const slippagePercent = params.slippage
        ? Math.floor(Number(params.slippage) * 100).toString()
        : '100'

      const queryParams = new URLSearchParams({
        quoteType: 'swap',
        inTokenSymbol: params.inTokenSymbol,
        inTokenAddress: params.inTokenAddress,
        outTokenSymbol: params.outTokenSymbol,
        outTokenAddress: params.outTokenAddress,
        amount: params.amount,
        ...(amountAll && { amountAll }),
        gasPrice: params.gasPrice || '5000000000',
        disabledDexIds: params.disabledDexIds || '',
        slippage: slippagePercent,
        account: params.account,
        referrer: params.referrer || this.defaultReferrer,
        flags: '0',
        disableRfq: '',
      })

      const response = await fetch(
        `${this.nearApiUrl}/swap-quote?${queryParams.toString()}`
      )
      const data = await this.parseApiResponse(
        response,
        'Failed to fetch swap quote'
      )
      return {
        data: {
          ...data,
          data: data.transaction,
          price_impact: 0,
        },
      }
    }

    const apiUrl = this.getApiUrl(params.chain)
    const slippage = Number(params.slippage || 0.01).toString()
    const referrer: Record<string, string | number> = {
      referrer: params.referrer || this.defaultReferrer,
    }
    if (params.referrerFee) {
      referrer.referrerFee = Number(params.referrerFee)
    }
    const queryParams = new URLSearchParams({
      quoteType: 'swap',
      inTokenSymbol: params.inTokenSymbol,
      inTokenAddress: this.getSolanaAddress(
        params.chain,
        params.inTokenAddress
      ),
      outTokenSymbol: params.outTokenSymbol,
      outTokenAddress: this.getSolanaAddress(
        params.chain,
        params.outTokenAddress
      ),
      amountDecimals: params.amount,
      account: params.account,
      slippage,
      gasPriceDecimals: params.gasPrice || '',
      disabledDexIds: params.disabledDexIds || '',
      enabledDexIds: params.enabledDexIds || '',
      ...Object.fromEntries(
        Object.entries(referrer).map(([key, value]) => [key, String(value)])
      ),
    })
    const response = await fetch(`${apiUrl}/swap?${queryParams.toString()}`)
    return this.parseApiResponse(response, 'Failed to fetch swap quote')
  }

  async getTokenList(chain: string) {
    const chainName = this.getChainName(chain)
    const response = await fetch(`${this.apiV4Url}/${chainName}/tokenList`)
    const data = await response.json()
    if (data.code !== 200) {
      if (chain === '20000000000001') {
        data.data = [
          {
            address: 'bitcoin',
            symbol: 'BTC',
            decimals: 8,
            isNative: true,
            name: 'Bitcoin',
            icon: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png',
            usd: '109559',
          },
        ]
      } else {
        throw new Error('Failed to fetch token list')
      }
    }
    return data.data.map((token: OpenOceanToken) => {
      let address = token.address
      if (
        chain === '1151111081099710' &&
        address === 'So11111111111111111111111111111111111111112'
      ) {
        address = '11111111111111111111111111111111'
      }
      if (address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        address = '0x0000000000000000000000000000000000000000'
      }
      return {
        address,
        symbol: token.symbol,
        decimals: token.decimals,
        name: token.name,
        logoURI: token.icon,
        priceUSD: token.usd,
        chainId: Number(chain),
        amount: 0n,
        featured: false,
        popular: false,
      }
    })
  }

  async getDexList(chain: string) {
    const apiUrl = this.getApiUrl(chain)
    const response = await fetch(`${apiUrl}/dexList`)
    return response.json()
  }

  async getGasPrice(chain: string) {
    if (
      !chain ||
      chain === '1151111081099710' ||
      chain === '20000000000001' ||
      chain === '20000000000006'
    ) {
      return {
        data: {
          gasPrice: '1000000000000000000',
        },
      }
    }
    const response = await fetch(`${this.apiV4Url}/${chain}/gasPrice`)
    const { data } = await response.json()
    if (chain == '1') {
      return {
        standard: data?.standard?.maxFeePerGas || '101021713',
        instant: data?.instant?.maxFeePerGas || '101021713',
        fast: data?.fast?.maxFeePerGas || '101021713',
      }
    }
    return data
  }

  async getTokenInfo(chain: string, tokenAddress: string) {
    const chainName = this.getChainName(chain)
    if (
      !tokenAddress ||
      (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress) &&
        !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(tokenAddress))
    ) {
      throw new Error('Invalid token address')
    }
    const response = await fetch(
      `${this.apiV4Url}/${chainName}/getTokenInfo?tokenAddress=${tokenAddress}`
    )
    const data = await response.json()
    if (!data || !data.address || !data.symbol || !data.decimals) {
      throw new Error('Failed to fetch token info')
    }
    return {
      address: data.address,
      symbol: data.symbol,
      decimals: data.decimals,
      name: data.name,
      logoURI: data.icon,
      priceUSD: data.usd,
      chainId: Number(chain),
      amount: 0n,
      featured: false,
      popular: false,
    }
  }

  async getTokensPrice(
    chain: string,
    tokenAddresses: string[]
  ): Promise<Record<string, string>> {
    let chainName = this.getChainName(chain)
    if (chain === '20000000000001') {
      tokenAddresses = ['0x2260fac5e5542a773aa44fbcfedf7c193bc2c599']
      chainName = '1'
    }

    const tokenAddressesStr = tokenAddresses.join(',')
    const response = await fetch(
      `${this.apiV3Url}/${chainName}/designated_tokenList?tokens=${tokenAddressesStr}`
    )
    const data = await response.json()

    if (data.code !== 200) {
      throw new Error('Failed to fetch token prices')
    }

    return data.data.reduce(
      (acc: Record<string, string>, token: OpenOceanToken) => {
        if (token.address && token.usd) {
          if (chain === '20000000000001') {
            acc.bitcoin = token.usd
          } else {
            acc[token.address.toLowerCase()] = token.usd
          }
        }
        return acc
      },
      {}
    )
  }

  async getRpcUrl() {
    if (this.solanaRpcUrl) {
      return this.solanaRpcUrl
    }
    const url = `${this.apiV3Url}/solana/getRpc`
    const response = await fetch(url)
    const data = await response.json()
    if (data.data?.openapi_v1) {
      this.solanaRpcUrl = data.data?.openapi_v1?.[0] || ''
    }
    if (data.data?.openapi_v2) {
      this.solanaRpcUrl = data.data?.openapi_v2?.[0] || ''
    }
    if (data.data?.openapi_v3) {
      this.solanaRpcUrl = data.data?.openapi_v3?.[0] || ''
    }
    return this.solanaRpcUrl
  }
}
