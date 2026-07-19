import type { Account } from '@leapswap/wallet-management'
import type {
  ExecutionStatus,
  LeapSwapStep,
  Process,
  Route,
} from '@leapswap/widget-sdk'
import { adaptSolanaWallet } from '@reservoir0x/relay-solana-wallet-adapter'
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js'
import { ethers } from 'ethers'
import { getPublicClient, getWalletClient } from 'wagmi/actions'
import { bridgeExecuteSwap } from '../cross/crossChainQuote.js'
import { useSettingsStore } from '../stores/settings/useSettingsStore.js'
import { sendAndConfirmSolanaTransaction } from './SendAndConfirmSolanaTransaction.js'
import { adaptBitcoinWallet } from '@relayprotocol/relay-bitcoin-wallet-adapter'
import * as bitcoin from 'bitcoinjs-lib';
import { LeapSwapService } from './LeapSwapService.js'

type DynamicSignPsbtParams = {
  allowedSighash: number[];
  unsignedPsbtBase64: string;
  signature: Array<{
    address: string;
    signingIndexes: number[];
  }>;
};
const LeapSwapABI = [
  {
    inputs: [
      {
        internalType: 'contract ILeapSwapCaller',
        name: 'caller',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'contract IERC20',
            name: 'srcToken',
            type: 'address',
          },
          {
            internalType: 'contract IERC20',
            name: 'dstToken',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'srcReceiver',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'dstReceiver',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'minReturnAmount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'guaranteedAmount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'flags',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'referrer',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct LeapSwapExchange.SwapDescription',
        name: 'desc',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'target',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'gasLimit',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        internalType: 'struct ILeapSwapCaller.CallDescription[]',
        name: 'calls',
        type: 'tuple[]',
      },
    ],
    name: 'swap',
    outputs: [
      {
        internalType: 'uint256',
        name: 'returnAmount',
        type: 'uint256',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
]

// Add helper function for handling hexadecimal conversion
function hexToUint8Array(hexString: string): Uint8Array {
  const pairs = hexString.match(/[\dA-F]{2}/gi) || []
  return new Uint8Array(pairs.map((s) => Number.parseInt(s, 16)))
}

/**
 * Convert amount with precision to actual amount
 * @param amount Amount with precision
 * @param decimals Precision
 * @returns Actual amount
 */
function decimals2Amount(amount: string | number, decimals = 18): number {
  return Number(amount) / 10 ** decimals
}

/**
 * Swap response type
 */
interface SwapResponse {
  inAmount?: string
  inToken?: {
    decimals?: number
    price?: string | number
    priceUSD?: string | number
    address?: string
  }
  data?: string
  from?: string
  to?: string
  value?: string
  minOutAmount?: string
}

/**
 * Adjust transaction parameters based on dynamic slippage to provide MEV protection
 */
async function swapQuoteMEV(
  response: SwapResponse,
  options?: { publicClient?: any }
): Promise<SwapResponse> {
  try {
    const inAmount = response?.inAmount
    const inTokenDecimals = response?.inToken?.decimals || 18
    const inTokenPrice = Number(response?.inToken?.priceUSD || 0)
    const amount = decimals2Amount(inAmount as string, inTokenDecimals) * inTokenPrice
    if (amount < 1) {
      return response
    }
    const { publicClient } = options || {}
    const LEAPSWAP_CONTRACT = new ethers.Contract(
      '0x6352a56caadC4F1E25CD6c75970Fa768A3304e64',
      LeapSwapABI
    )
    if (
      ethers.hexlify(ethers.getBytes(response?.data || '0x').slice(0, 4)) !==
      LEAPSWAP_CONTRACT?.interface?.getFunction('swap')?.selector
    ) {
      return response
    }
    const oldCallData = LEAPSWAP_CONTRACT.interface.decodeFunctionData(
      'swap',
      response?.data as any
    )
    const callData = [...oldCallData]
    callData[1] = [...oldCallData[1]]
    const minOutAmount = BigInt(callData[1][5] || 0)
    const outAmount = BigInt(callData[1][6] || 0)
    const slippageAmount = outAmount - minOutAmount

    const minOutAmounts = await Promise.all(
      [1, 2, 3].map(async (i) => {
        const mockMinOutAmount =
          minOutAmount + (slippageAmount / 4n) * BigInt(i)
        callData[1][5] = mockMinOutAmount
        const params = {
          from: response?.from as `0x${string}`,
          to: response?.to as `0x${string}`,
          data: LEAPSWAP_CONTRACT.interface.encodeFunctionData(
            'swap',
            callData
          ) as `0x${string}`,
          value: BigInt(response?.value || '0'),
        }
        try {
          await publicClient.estimateGas(params)
          return mockMinOutAmount
        } catch (error) {
          console.error('Failed to estimate gas:', error)
          return undefined
        }
      })
    )
    let [min1, min2] = minOutAmounts
      .filter((value) => value !== undefined)
      .sort((a, b) => (BigInt(b || 0) > BigInt(a || 0) ? 1 : -1))
      .slice(0, 2)
    min1 = min1 ?? minOutAmount
    min2 = min2 ?? minOutAmount

    const randomFactor = BigInt(Math.floor(Math.random() * 10000))
    const minOutAmountDiff = BigInt(min1 || 0) - BigInt(min2 || 0)
    const finalMinOutAmount =
      BigInt(min2 || 0) + (minOutAmountDiff * randomFactor) / BigInt(10000)

    if (finalMinOutAmount < minOutAmount) {
      return response
    }
    callData[1][5] = finalMinOutAmount
    const finalCallData = LEAPSWAP_CONTRACT.interface.encodeFunctionData(
      'swap',
      callData
    )
    response.minOutAmount = finalMinOutAmount.toString()
    response.data = finalCallData
    return response
  } catch {
    return response
  }
}

interface ExecuteRouteOptions {
  updateRouteHook?: (route: Route) => void
  acceptExchangeRateUpdateHook?: (params: any) => Promise<boolean>
  infiniteApproval?: boolean
  executeInBackground?: boolean
  account: Account
  wagmiConfig: any // Use any to avoid deep type instantiation
  onDisconnect?: (account: Account) => Promise<void>
  onOpenWalletMenu?: () => void
  solanaWallet?: any
  // Near wallet-selector 实例从 React 层通过 options 传入，避免在此文件中直接调用 Hook
  nearWallet?: any
}

interface ExtendedLeapSwapStep extends LeapSwapStep {
  quoteData?: any
  execution?: {
    status: ExecutionStatus
    process: Process[]
  }
  toolData?: {
    data: string
  }
}

interface ExtendedRoute extends Route {
  steps: ExtendedLeapSwapStep[]
  prependedOperatingExpenseCost?: string
  data?: {
    prependedOperatingExpenseCost?: string
  }
}

// Execute Solana transaction
async function executeSolanaSwap(
  step: ExtendedLeapSwapStep,
  options: ExecuteRouteOptions,
  process: Process,
  route: ExtendedRoute
): Promise<void> {
  try {
    // Check wallet connection status
    if (!options.account || !options.account.connector) {
      throw new Error('Wallet not connected or connector not initialized')
    }

    const rpcUrl = await LeapSwapService.getRpcUrl()
    let transaction: any = ''
    const connection = new Connection(rpcUrl)

    const { transactionRequest, type, quoteData } = step || {}
    if ((type as any) === 'bridge') {
      // Define signAndSendTransaction function
      const signAndSendTransaction = async (transaction: Transaction | VersionedTransaction) => {
        try {
          // Ensure transaction is properly formatted
          if (
            transaction instanceof VersionedTransaction ||
            transaction instanceof Transaction
          ) {
            const connector = options.account.connector as any
            if (typeof connector.signTransaction !== 'function') {
              throw new Error('Wallet does not support transaction signing')
            }

            // Sign transaction
            const signature = await connector.signTransaction(transaction)
            const serializedTransaction = signature.serialize({
              verifySignatures: false,
              requireAllSignatures: false,
            })
            const txid = await connection.sendRawTransaction(
              serializedTransaction,
              {
                skipPreflight: true,
              }
            )
            return { signature: txid }
          }

          throw new Error('Invalid transaction type')
        } catch (error) {
          console.error('Transaction sending failed:', error)
          throw error
        }
      }

      const adaptedWallet: any = adaptSolanaWallet(
        options.account.address?.toString() ||
        '1nc1nerator11111111111111111111111111111111',
        792703809, //chain id that Relay uses to identify solana
        connection,
        signAndSendTransaction
      )

      // Expose connection and sendTransaction method for adapters to use
      adaptedWallet.connection = connection
      adaptedWallet.sendTransaction = signAndSendTransaction

      const signedTx = await bridgeExecuteSwap({
        quoteData: quoteData,
        walletClient: adaptedWallet,
        nearWallet: options.nearWallet,
      })
      if (!signedTx) {
        throw new Error('Failed to sign transaction')
      }
      const hash = signedTx.sourceTxHash

      process.status = 'DONE'
      process.doneAt = Date.now()
      process.txHash = hash
      process.message = 'Transaction confirmed'
      options.updateRouteHook?.(route)

      // process.status = 'PENDING'
      // process.txHash = hash
      // process.message = 'Transaction pending'
      // options.updateRouteHook?.(route)
    } else {
      const txData: any = transactionRequest?.data || ''
      const dexId = transactionRequest?.type || 0
      if (step.action.fromChainId === step.action.toChainId) {
        if (dexId === 6 || dexId === 7 || dexId === 9 || dexId === 10) {
          transaction = VersionedTransaction.deserialize(
            hexToUint8Array(txData)
          )
        } else {
          transaction = Transaction.from(hexToUint8Array(txData))
        }
      } else {
        transaction = VersionedTransaction.deserialize(
          hexToUint8Array(txData.slice(2))
        )

        const { blockhash } = await connection.getLatestBlockhash()
        transaction.message.recentBlockhash = blockhash
      }

      // Check signTransaction method exists
      const connector = options.account.connector as any
      if (typeof connector.signTransaction !== 'function') {
        throw new Error('Wallet does not support transaction signing')
      }

      // Sign transaction
      const signedTx = await connector.signTransaction(transaction)
      if (!signedTx) {
        throw new Error('Failed to sign transaction')
      }

      // Serialize signed transaction
      const serializedTransaction = signedTx.serialize({
        verifySignatures: false,
        requireAllSignatures: false,
      })

      // Use improved transaction sender
      await sendAndConfirmSolanaTransaction({
        connection,
        serializedTransaction,
        process,
        updateRouteHook: (updatedProcess) => {
          // Update process status
          Object.assign(process, updatedProcess)

          // Update step execution status
          if (process.status === 'DONE') {
            step.execution!.status = 'DONE'
          } else if (process.status === 'FAILED') {
            step.execution!.status = 'FAILED'
          } else {
            step.execution!.status = 'PENDING'
          }

          // Call original updateRouteHook
          options.updateRouteHook?.(route)
        },
      })
    }
  } catch (error) {
    console.error('Solana swap execution failed:', error)
    process.status = 'FAILED'
    process.error =
      error instanceof Error
        ? {
          code: 'EXECUTION_ERROR',
          message: error.message,
          htmlMessage: error.message,
        }
        : {
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error occurred',
          htmlMessage: 'Unknown error occurred',
        }
    step.execution!.status = 'FAILED'
    options.updateRouteHook?.(route)
    throw error
  }
}

// Execute EVM transaction
async function executeEvmSwap(
  step: ExtendedLeapSwapStep,
  options: ExecuteRouteOptions,
  process: Process,
  route: ExtendedRoute
): Promise<void> {
  try {
    let walletClient = await getWalletClient(options.wagmiConfig)
    // Check if wallet is connected
    if (!walletClient) {
      if (options.account?.connector && options.onDisconnect) {
        await options.onDisconnect(options.account)
      }
      if (options.onOpenWalletMenu) {
        options.onOpenWalletMenu()
      }
      throw new Error('Please connect wallet first')
    }

    // Check if current chain matches target chain
    console.log(
      'walletClient',
      walletClient,
      walletClient.chain,
      walletClient.getChainId
    )
    const currentChainId = await walletClient.getChainId()
    const targetChainId = step.action.fromChainId
    if (currentChainId != targetChainId && targetChainId != 20000000000001) {
      try {
        // Try to switch to target chain
        await walletClient.switchChain({ id: targetChainId })

        // Get updated walletClient after chain switch
        walletClient = (await getWalletClient(options.wagmiConfig)) as any
        const currentChainId2 = await walletClient.getChainId()

        if (!walletClient || currentChainId2 !== targetChainId) {
          throw new Error('Failed to switch chain')
        }
      } catch (error) {
        console.error('Failed to switch chain:', error)
        throw new Error(`Please manually switch to chain ID: ${targetChainId}`)
      }
    }

    const publicClient = getPublicClient(options.wagmiConfig)
    if (!publicClient) {
      // If disconnect callback exists, disconnect the current connection first
      if (options.account?.connector && options.onDisconnect) {
        await options.onDisconnect(options.account)
      }
      // Open wallet menu to let user reconnect
      if (options.onOpenWalletMenu) {
        options.onOpenWalletMenu()
      }
      throw new Error('Public client not found')
    }

    // console.log(
    //   'Current Chain:',
    //   publicClient.chain?.id,
    //   publicClient.chain?.name
    // )
    // console.log('Token Address:', step.action.fromToken.address)
    // console.log('Token Chain ID:', step.action.fromToken.chainId)
    // console.log('Owner Address:', walletClient.account.address)
    // console.log('Spender Address:', step.estimate.approvalAddress)
    // Check token approval
    if (
      [
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000001010',
      ].indexOf(step.action.fromToken.address) === -1 &&
      step.estimate.approvalAddress !==
      '0x0000000000000000000000000000000000000000'
    ) {
      let allowance = 0n
      try {
        allowance = (await (publicClient as any).readContract({
          address: step.action.fromToken.address as `0x${string}`,
          abi: [
            {
              constant: true,
              inputs: [
                { name: 'owner', type: 'address' },
                { name: 'spender', type: 'address' },
              ],
              name: 'allowance',
              outputs: [{ name: '', type: 'uint256' }],
              type: 'function',
            },
          ],
          functionName: 'allowance',
          args: [
            walletClient.account.address,
            step.estimate.approvalAddress as `0x${string}`,
          ],
        })) as bigint
      } catch (error) {
        console.error('Failed to read allowance:', error)
        // Log additional context
        console.error('Context - Step:', JSON.stringify(step, null, 2))
        console.error('Context - Route:', JSON.stringify(route, null, 2))
        console.error('Context - Public Client Chain:', publicClient.chain)
        // Re-throw the error or handle it appropriately
        // throw new Error(`Failed to read allowance for token ${step.action.fromToken.address}: ${error instanceof Error ? error.message : String(error)}`);
      }

      const amount =
        BigInt(step.action.fromAmount) +
        BigInt(
          route?.prependedOperatingExpenseCost ||
          route?.data?.prependedOperatingExpenseCost ||
          '0'
        )
      if (allowance < BigInt(amount)) {
        const approvalAmount = options.infiniteApproval
          ? BigInt(
            '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
          )
          : BigInt(amount)

        const hash = await walletClient.writeContract({
          chain: walletClient.chain || undefined,
          account: walletClient.account,
          address: step.action.fromToken.address as `0x${string}`,
          abi: [
            {
              constant: false,
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
              name: 'approve',
              outputs: [{ name: '', type: 'bool' }],
              type: 'function',
            },
          ],
          functionName: 'approve',
          args: [
            step.estimate.approvalAddress as `0x${string}`,
            approvalAmount,
          ],
        })

        await publicClient.waitForTransactionReceipt({ hash })
      }
    }

    const { transactionRequest, type, quoteData } = step || {}
    let hash: any = ''
    if ((type as any) === 'bridge') {
      const result = await bridgeExecuteSwap({
        quoteData: quoteData,
        walletClient: walletClient,
        nearWallet: options.nearWallet,
      })
      hash = result?.sourceTxHash || ''
    } else {
      const txRequest = {
        chain: publicClient.chain,
        to: transactionRequest?.to as `0x${string}`,
        data: (transactionRequest?.data as `0x${string}`) || '0x',
        value: BigInt(transactionRequest?.value || '0x0'),
        account: walletClient.account.address,
      }

      // Check if dynamicSlippage is enabled in useSettingsStore to determine whether to call swap_quote_mev
      const { dynamicSlippage } = useSettingsStore.getState()
      if (dynamicSlippage) {
        try {
          // Build response object
          const response = {
            inAmount: step.action.fromAmount || '0',
            inToken: step.action.fromToken,
            data: transactionRequest?.data,
            from: walletClient.account.address,
            to: transactionRequest?.to,
            value: transactionRequest?.value || '0',
          }

          // Call swap_quote_mev to get adjusted transaction data
          const adjustedResponse = await swapQuoteMEV(response, {
            publicClient,
          })

          // If swap_quote_mev returns modified data, update transaction request
          if (adjustedResponse && adjustedResponse.data !== response.data) {
            txRequest.data = adjustedResponse.data as `0x${string}`
            txRequest.value = BigInt(adjustedResponse.value || '0')
            // Applied MEV protection with dynamic slippage
          }
        } catch (error) {
          console.error('Failed to apply MEV protection:', error)
          // Continue with original transaction request on error
        }
      }

      // Estimate gas
      const estimatedGas = await publicClient.estimateGas(txRequest)

      // Add estimated gas to transaction request (using 2x the estimated value to ensure transaction success)
      const finalTxRequest = {
        ...txRequest,
        gas: estimatedGas * 2n,
      }

      hash = await walletClient.sendTransaction({
        ...finalTxRequest,
        kzg: undefined,
      })
    }

    process.status = 'PENDING'
    process.txHash = hash
    process.message = 'Transaction pending'
    options.updateRouteHook?.(route)

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    process.status = receipt.status === 'success' ? 'DONE' : 'FAILED'
    process.doneAt = Date.now()
    process.message =
      receipt.status === 'success'
        ? 'Transaction confirmed'
        : 'Transaction failed'

    step.execution!.status = receipt.status === 'success' ? 'DONE' : 'FAILED'
    options.updateRouteHook?.(route)

    if (receipt.status !== 'success') {
      throw new Error('Transaction failed')
    }
  } catch (error: any) {
    console.error('EVM swap execution failed:', error)
    process.status = 'FAILED'
    process.error =
      error?.details || error?.message
        ? {
          code: 'EXECUTION_ERROR',
          message: error?.details || error?.message,
          htmlMessage: error?.details || error?.message,
        }
        : {
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error occurred',
          htmlMessage: 'Unknown error occurred',
        }
    step.execution!.status = 'FAILED'
    options.updateRouteHook?.(route)
    throw new Error(error?.details || error?.message)
  }
}

const createPsbtOptions = (_: any, request: any) => {
  var _a;
  const psbtSignOptions: any = {
    autoFinalized: false,
  };
  if (request.signature) {
    // validatePsbt(psbt, request.allowedSighash, request.signature);

    const toSignInputs = [];
    for (const signature of request.signature) {
      if ((_a = signature.signingIndexes) === null || _a === void 0 ? void 0 : _a.length) {
        for (const index of signature.signingIndexes) {
          toSignInputs.push({
            address: signature.address,
            disableAddressValidation: signature.disableAddressValidation,
            index,
            sighashTypes: request.allowedSighash,
          });
        }
      }
    }
    psbtSignOptions.toSignInputs = toSignInputs;
  }
  return psbtSignOptions;
};

// Helper function to convert hex response to base64
function convertHexToBase64(hexString: string): string {
  try {
    const buffer = Buffer.from(hexString, 'hex');
    return buffer.toString('base64');
  } catch (error) {
    // If conversion fails, it might already be base64
    return hexString;
  }
}

// Helper function to extract signed PSBT from wallet response
function extractSignedPsbt(response: any): string | null {
  if (!response) return null;
  if (typeof response === 'string') return response;
  return response.signedPsbtHex || response.signedPsbtBase64 || response.signedPsbt || null;
}


// BTC 主网
const network = bitcoin.networks.bitcoin;

export async function sendBTCWithPhantom(sender: string, recipient: string, amount: number) {
  const phantom = (window as any).phantom?.bitcoin;
  if (!phantom) throw new Error("Phantom Bitcoin provider not found");
  // 1. 获取 UTXO（这里使用 mempool.space API，你也可以换自己的）
  const utxos = await fetch(
    `https://mempool.space/api/address/${sender}/utxo`
  ).then((r) => r.json());

  if (!utxos.length) throw new Error("No UTXO available");

  // ====== 费用参数 ======
  // amount / fee 单位都按 satoshi 处理，调用方需要保证一致
  const fee = 5000; // 手续费（可以根据当前网络费率动态调整）
  const required = BigInt(amount + fee);

  // 2. 简单的累加选币：从小到大选 UTXO，直到覆盖 amount + fee
  const sortedUtxos = [...utxos].sort(
    (a: any, b: any) => Number(a.value) - Number(b.value)
  );

  const selectedUtxos: any[] = [];
  let totalInput = 0n;

  for (const utxo of sortedUtxos) {
    selectedUtxos.push(utxo);
    totalInput += BigInt(utxo.value);
    if (totalInput >= required) break;
  }

  if (totalInput < required) {
    throw new Error("Insufficient balance: UTXOs do not cover amount + fee");
  }

  const changeValue = totalInput - required;

  // 可选：避免输出过小（dust），这里简单判断 >0 即可，如需更严格可改成 > 546
  if (changeValue <= 0n) {
    throw new Error("UTXOs too small to cover amount and fee with change");
  }

  // 3. 构造 PSBT（多输入）
  const psbt = new bitcoin.Psbt({ network });

  selectedUtxos.forEach((utxo) => {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        // bitcoinjs-lib 期望 bigint，这里将 mempool 返回的 number 转成 bigint
        value: BigInt(utxo.value),
        script: bitcoin.address.toOutputScript(sender, network),
      },
    });
  });

  // 目标地址 output
  psbt.addOutput({
    address: recipient,
    value: BigInt(amount),
  });

  // 找零 output
  psbt.addOutput({
    address: sender,
    value: changeValue,
  });

  // 4. 调用 Phantom.signPSBT
  const psbtBase64 = psbt.toBase64();

  const signOptions = {
    autoFinalized: false,
    toSignInputs: selectedUtxos.map((_, index) => ({
      address: sender,
      index,
      // SIGHASH_ALL (0x01) 通常足够，如有需要可根据业务调整
      sighashTypes: [0, 1], // 保持和原来一致
    })),
  };

  const signed = await phantom.signPSBT(psbtBase64, signOptions);

  // Phantom 返回 Base64
  const signedPsbt = bitcoin.Psbt.fromBase64(signed);

  // 5. Finalize + 提取原始交易
  signedPsbt.finalizeAllInputs();
  const rawTx = signedPsbt.extractTransaction().toHex();

  // 6. 广播 Raw TX
  const txid = await fetch("https://mempool.space/api/tx", {
    method: "POST",
    body: rawTx,
  }).then((r) => r.text());

  console.log("Broadcasted TXID:", txid);
  return txid;
}


async function executeBitcoinSwap(
  step: ExtendedLeapSwapStep,
  options: ExecuteRouteOptions,
  process: Process,
  route: ExtendedRoute
): Promise<void> {
  try {

    const { quoteData } = step || {}
    const adaptedWallet: any = adaptBitcoinWallet(
      options.account.address?.toString() || '',
      async (_: any, __: any, dynamicParams: DynamicSignPsbtParams) => {
        const psbtFromBase64 = bitcoin.Psbt.fromBase64(dynamicParams.unsignedPsbtBase64);
        const psbtHex = psbtFromBase64.toHex();
        const connector = options.account.connector;
        const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined
        switch (connector?.name) {
          case 'OKX Wallet': {
            const response = await anyWindow.okxwallet?.bitcoin?.signPsbt(
              psbtHex,
              createPsbtOptions(psbtFromBase64, dynamicParams)
            );
            const signedPsbt = extractSignedPsbt(response);
            if (!signedPsbt) {
              throw new Error('Missing psbt response from OKX wallet');
            }
            return convertHexToBase64(signedPsbt);
          }

          case 'Unisat': {
            const response = await anyWindow.unisat?.signPsbt(
              psbtHex,
              createPsbtOptions(psbtFromBase64, dynamicParams)
            );
            const signedPsbt = extractSignedPsbt(response);
            if (!signedPsbt) {
              throw new Error('Missing psbt response from Unisat wallet');
            }
            return convertHexToBase64(signedPsbt);
          }

          case 'Xverse': {
            const response = await anyWindow.BitcoinProvider?.request('signPsbt', {
              psbt: psbtHex,
              finalize: true,
            });
            const signedPsbt = extractSignedPsbt(response);
            if (!signedPsbt) {
              throw new Error('Missing psbt response from Xverse wallet');
            }
            return convertHexToBase64(signedPsbt);
          }

          case 'Phantom': {
            const phantom = anyWindow.phantom?.bitcoin;
            if (!phantom?.signPSBT) throw new Error('Phantom wallet does not support signPSBT');

            const inputsToSign = [];
            console.log("Phantom options = ", JSON.stringify(createPsbtOptions(psbtFromBase64, dynamicParams)));
            console.log("psbtHex = ", psbtHex);
            console.log("psbtBase64 = ", psbtFromBase64.toBase64());

            for (const sig of dynamicParams.signature || []) {
              for (const index of sig.signingIndexes || []) {
                inputsToSign.push({
                  index,
                  address: sig.address,
                  sighashTypes: dynamicParams.allowedSighash,
                });
              }
            }

            const response = await phantom.signPSBT(
              psbtFromBase64.toBase64(),   // ✅ Phantom only accepts base64
              {
                autoFinalize: false,              // ✅ correct name
                inputsToSign,                     // ✅ correct name
              }
            );

            const signedPsbt = extractSignedPsbt(response);
            if (!signedPsbt) throw new Error('Missing psbt response from Phantom wallet');

            return signedPsbt; // already base64
          }


          default:
            throw new Error(`Unsupported wallet: ${connector?.name || 'Unknown'}`);
        }
      }
    );
    adaptedWallet.sendTransaction = async (params: { recipient: string; amount: string | number }) => {
      const connector = options.account.connector;
      const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined

      // Convert amount to satoshis (BTC amount * 100000000)
      const amountInSatoshis = Number(params.amount)
      switch (connector?.name) {
        case 'OKX Wallet': {
          // OKX wallet sendBitcoin method
          if (anyWindow.okxwallet?.bitcoin?.sendBitcoin) {
            const txid = await anyWindow.okxwallet.bitcoin.sendBitcoin(
              params.recipient,
              amountInSatoshis
            );
            return txid;
          }
          throw new Error('OKX wallet does not support sendBitcoin');
        }

        case 'Unisat': {
          // Unisat wallet sendBitcoin method
          if (anyWindow.unisat?.sendBitcoin) {
            const txid = await anyWindow.unisat.sendBitcoin(
              params.recipient,
              amountInSatoshis
            );
            return txid;
          }
          throw new Error('Unisat wallet does not support sendBitcoin');
        }

        case 'Xverse': {
          // Xverse wallet sendBitcoin method
          if (anyWindow.BitcoinProvider?.request) {
            const response = await anyWindow.BitcoinProvider.request('sendBitcoin', {
              address: params.recipient,
              amount: amountInSatoshis,
            });
            return response.txid || response;
          }
          throw new Error('Xverse wallet does not support sendBitcoin');
        }

        case 'Phantom': {
          // Phantom wallet sendBitcoin method
          const txid = await sendBTCWithPhantom(
            options.account.address?.toString() || '',
            params.recipient,
            amountInSatoshis
          );
          return txid;
        }

        default:
          throw new Error(`Unsupported wallet: ${connector?.name}`);
      }
    }

    const signedTx = await bridgeExecuteSwap({
      quoteData: quoteData,
      walletClient: adaptedWallet,
      nearWallet: options.nearWallet,
    });

    if (!signedTx) {
      throw new Error('Failed to sign transaction')
    }
    const hash = signedTx.sourceTxHash

    process.status = 'DONE'
    process.doneAt = Date.now()
    process.txHash = hash
    process.message = 'Transaction confirmed'
    options.updateRouteHook?.(route)

    // process.status = 'PENDING'
    // process.txHash = hash
    // process.message = 'Transaction pending'
    // options.updateRouteHook?.(route)


  } catch (error) {
    process.status = 'FAILED'
    process.error =
      error instanceof Error || (error && (error as any)?.message)
        ? {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          htmlMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        }
        : {
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error occurred',
          htmlMessage: 'Unknown error occurred',
        }
    step.execution!.status = 'FAILED'
    options.updateRouteHook?.(route)
    throw error
  }
}

// Execute Near transaction via Near Intents adapter
async function executeNearSwap(
  step: ExtendedLeapSwapStep,
  options: ExecuteRouteOptions,
  process: Process,
  route: ExtendedRoute
): Promise<void> {
  try {
    const { type, transactionRequest } = step || {}

    if ((type as any) === 'bridge') {

      const { quoteData } = step || {}

      if (!quoteData) {
        throw new Error('Missing Near quote data.')
      }

      // NearIntentsAdapter 的 Near 分支只依赖 nearWallet，不依赖 walletClient，
      // 这里传一个占位对象即可。
      const dummyWalletClient: any = {}

      const result = await bridgeExecuteSwap({
        quoteData,
        walletClient: dummyWalletClient,
        nearWallet: options.nearWallet,
      })

      if (!result) {
        throw new Error('Failed to execute Near swap.')
      }

      const hash = result.sourceTxHash

      process.status = 'DONE'
      process.doneAt = Date.now()
      process.txHash = hash
      process.message = 'Transaction confirmed'
      step.execution!.status = 'DONE'
      options.updateRouteHook?.(route)
    } else {
      let transactions = JSON.parse(Buffer.from(transactionRequest.data, 'base64').toString())
      const wallet = options.nearWallet
      const txs = transactions.map((t: any, i: number) => {
        return {
          receiverId: t.receiverId,
          // nonceOffset: i + 1,
          signerId: wallet.signedAccountId,
          actions: t.functionCalls.map((fc: any) => {
            if (fc.deposit) {
              const depositNum = typeof fc.deposit === 'string' ? parseFloat(fc.deposit) : fc.deposit
              if (depositNum > 0) {
                const depositStr = depositNum.toFixed(24)
                fc.deposit = depositStr.replace('.', '').replace(/^0+/, '') || '0'
              } else {
                fc.deposit = '0'
              }
            }
            return {
              type: 'FunctionCall',
              params: {
                methodName: fc.methodName,
                args: {
                  ...fc.args,
                },
                gas: fc.gas,
                deposit: fc.deposit,
              },
            }
          })
        };
      })
      const txResult = await wallet.signAndSendTransactions({
        transactions: txs
      });

      let transaction: any = { hash: "" };
      if (txResult && txResult.length === 1) {
        transaction = txResult[txResult.length - 1].transaction || {};
      } else if (txResult && txResult.length > 1) {
        transaction = txResult.filter((item: any) => {
          const { actions = [] } = item && item.transaction || {};
          const _actions = actions.filter((fc: any) => {
            const { FunctionCall = {} } = fc;
            const { method_name } = FunctionCall;
            return method_name === 'ft_transfer_call';
          });
          return _actions && _actions.length > 0;
        });
        if (transaction && transaction.length) {
          transaction = transaction[0].transaction;
        } else {
          transaction = txResult[txResult.length - 1].transaction || {};
        }
      }
      console.log('signAndSendTransactions', transaction);
      const { hash } = transaction;
      process.status = 'DONE'
      process.doneAt = Date.now()
      process.txHash = hash
      process.message = 'Transaction confirmed'
      step.execution!.status = 'DONE'
      options.updateRouteHook?.(route)
    }
  } catch (error) {
    console.error('Near swap execution failed:', error)
    process.status = 'FAILED'
    process.error =
      error instanceof Error || (error && (error as any)?.message)
        ? {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          htmlMessage:
            error instanceof Error ? error.message : 'Unknown error occurred',
        }
        : {
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error occurred',
          htmlMessage: 'Unknown error occurred',
        }
    step.execution!.status = 'FAILED'
    options.updateRouteHook?.(route)
    throw error
  }

}
// Execute transaction
async function executeSwap(
  route: ExtendedRoute,
  options: ExecuteRouteOptions
): Promise<Route> {
  const updatedRoute = { ...route }

  try {
    // Execute transactions for each step
    for (const step of updatedRoute.steps) {
      // Update status to start execution
      const process: Process = {
        type: 'SWAP',
        status: 'STARTED',
        startedAt: Date.now(),
        message: 'Preparing swap transaction',
        txHash: '',
      }

      step.execution = {
        status: 'PENDING',
        process: [process],
      }

      options.updateRouteHook?.(updatedRoute)

      // Check wallet connection status
      if (!options.account || !options.account.connector) {
        // If connector exists but not connected, disconnect first
        if (options.account?.connector && options.onDisconnect) {
          await options.onDisconnect(options.account)
        }
        // Open wallet menu
        if (options.onOpenWalletMenu) {
          options.onOpenWalletMenu()
        }
        throw new Error('Please connect wallet first')
      }
      // Execute different transaction logic based on chain type
      const currentStep = route.steps[0]
      if (currentStep.action?.fromChainId === 1151111081099710) {
        await executeSolanaSwap(currentStep, options, process, updatedRoute)
      } else if (currentStep.action?.fromChainId === 20000000000001) {
        await executeBitcoinSwap(currentStep, options, process, updatedRoute)
      } else if (currentStep.action?.fromChainId === 20000000000006) {
        await executeNearSwap(currentStep, options, process, updatedRoute)
      } else {
        await executeEvmSwap(currentStep, options, process, updatedRoute)
      }
    }

    return updatedRoute
  } catch (error: unknown) {
    console.error('Swap execution failed:', error)
    updatedRoute.steps.forEach((step) => {
      if (step.execution?.status === 'PENDING') {
        step.execution.status = 'FAILED'
        step.execution.process[0].status = 'FAILED'
        step.execution.process[0].message =
          error instanceof Error ? error.message : 'Transaction failed'
      }
    })

    options.updateRouteHook?.(updatedRoute)
    throw error
  }
}

// Export main function
export async function executeRoute(
  route: Route,
  options: ExecuteRouteOptions
): Promise<Route> {
  // Check wallet connection status
  if (!options.account.isConnected) {
    throw new Error('Wallet not connected')
  }
  return executeSwap(route as ExtendedRoute, options)
}
