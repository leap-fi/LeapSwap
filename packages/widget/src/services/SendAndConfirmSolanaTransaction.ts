/**
 * Solana Transaction Sending Service
 *
 * This module handles sending and confirming transactions on Solana blockchain
 */

import type {
  BlockhashWithExpiryBlockHeight,
  Connection,
} from '@solana/web3.js'

/**
 * Delay execution helper
 * @param ms Delay time in milliseconds
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Transaction sending and confirmation parameters interface
 */
interface SolanaTransactionParams {
  /** Solana RPC connection instance */
  connection: Connection
  /** Serialized transaction data */
  serializedTransaction: Buffer
  /** Blockhash with expiry block height */
  blockhashWithExpiryBlockHeight?: BlockhashWithExpiryBlockHeight
  /** Transaction process object */
  process?: any
  /** Route update callback function */
  updateRouteHook?: (route: any) => void
}

/**
 * Send raw transaction to Solana network
 *
 * @param connection Solana RPC connection instance
 * @param serializedTransaction Serialized transaction data
 * @param process Transaction process object
 * @param updateRouteHook Route update callback function
 * @returns Transaction hash
 */
async function sendSolanaTransaction(
  connection: Connection,
  serializedTransaction: Buffer,
  process: any,
  updateRouteHook?: (route: any) => void
): Promise<string> {
  try {
    // Send transaction to network
    const txid = await connection.sendRawTransaction(serializedTransaction, {
      skipPreflight: true,
    })
    // Update transaction status to pending
    if (process && updateRouteHook) {
      process.status = 'PENDING'
      process.txHash = txid
      process.message = 'Transaction pending'
      updateRouteHook(process.route)
    }

    return txid
  } catch (error) {
    console.error('Failed to send transaction:', error)
    if (process && updateRouteHook) {
      process.status = 'FAILED'
      process.message =
        error instanceof Error ? error.message : 'Failed to send transaction'
      updateRouteHook(process.route)
    }
    throw error
  }
}

/**
 * Confirm Solana transaction status
 *
 * @param connection Solana RPC connection instance
 * @param txid Transaction hash
 * @param process Transaction process object
 * @param updateRouteHook Route update callback function
 * @param maxRetries Maximum retry attempts
 * @returns Whether transaction succeeded
 */
async function confirmSolanaTransaction(
  connection: Connection,
  txid: string,
  process: any,
  updateRouteHook?: (route: any) => void,
  maxRetries = 30
): Promise<boolean> {
  let retries = 0

  while (retries < maxRetries) {
    try {
      // Get latest blockhash
      const latestBlockhash = await connection.getLatestBlockhash()

      // Confirm transaction status
      const confirmation = await connection.confirmTransaction({
        signature: txid,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      })

      // Check if transaction failed
      if (confirmation.value.err) {
        if (process && updateRouteHook) {
          process.status = 'FAILED'
          process.message = 'Transaction failed on chain'
          updateRouteHook(process.route)
        }
        return false
      }

      // Transaction confirmed successfully
      if (process && updateRouteHook) {
        process.status = 'DONE'
        process.doneAt = Date.now()
        process.message = 'Transaction confirmed'
        updateRouteHook(process.route)
      }
      return true
    } catch (error) {
      console.warn('Confirmation attempt failed:', error)
      await delay(2000) // Wait 2 seconds before retrying
      retries++
    }
  }

  // Exceeded maximum retry attempts
  if (process && updateRouteHook) {
    process.status = 'FAILED'
    process.message = 'Transaction confirmation timeout'
    updateRouteHook(process.route)
  }
  throw new Error('Transaction confirmation timeout')
}

/**
 * Send and wait for Solana transaction confirmation
 *
 * @param params Transaction parameters
 * @returns Transaction response and hash
 */
export async function sendAndConfirmSolanaTransaction({
  connection,
  serializedTransaction,
  process,
  updateRouteHook,
}: SolanaTransactionParams): Promise<any> {
  try {
    // Send transaction and get transaction hash
    const txid = await sendSolanaTransaction(
      connection,
      serializedTransaction,
      process,
      updateRouteHook
    )

    // Wait for transaction confirmation
    const success = await confirmSolanaTransaction(
      connection,
      txid,
      process,
      updateRouteHook
    )

    if (!success) {
      throw new Error('Transaction failed during confirmation')
    }

    // Get transaction details
    const response = await connection.getTransaction(txid, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    })

    if (!response) {
      throw new Error('Failed to fetch transaction details')
    }

    return { response, txid }
  } catch (error) {
    console.error('Transaction failed:', error)
    throw error
  }
}
