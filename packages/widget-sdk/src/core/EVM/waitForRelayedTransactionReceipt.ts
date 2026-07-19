import type {
  ExtendedTransactionInfo,
  LeapSwapStep,
} from '@leapswap/widget-types'
import type { Hash, WalletCallReceipt as _WalletCallReceipt } from 'viem'
import { LeapSwapErrorCode } from '../../errors/constants.js'
import { TransactionError } from '../../errors/errors.js'
import { getRelayedTransactionStatus } from '../../services/api.js'
import { waitForResult } from '../../utils/waitForResult.js'

export type WalletCallReceipt = _WalletCallReceipt<
  bigint,
  'success' | 'reverted'
>

export const waitForRelayedTransactionReceipt = async (
  taskId: Hash,
  step: LeapSwapStep
): Promise<WalletCallReceipt> => {
  return waitForResult(
    async () => {
      const result = await getRelayedTransactionStatus({
        taskId,
        fromChain: step.action.fromChainId,
        toChain: step.action.toChainId,
        ...(step.tool !== 'custom' && { bridge: step.tool }),
      }).catch((e) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('Fetching status from relayer failed.', e)
        }
        return undefined
      })

      switch (result?.status) {
        case 'PENDING':
          return undefined
        case 'DONE': {
          const sending: ExtendedTransactionInfo | undefined = result
            ?.transactionStatus?.sending as ExtendedTransactionInfo
          return {
            status: 'success',
            gasUsed: sending?.gasUsed,
            transactionHash: result?.metadata.txHash,
          } as unknown as WalletCallReceipt
        }
        case 'FAILED':
          throw new TransactionError(
            LeapSwapErrorCode.TransactionFailed,
            'Transaction was reverted.'
          )
        default:
          throw new TransactionError(
            LeapSwapErrorCode.TransactionNotFound,
            'Transaction not found.'
          )
      }
    },
    5000,
    3,
    (_, error) => {
      return !(error instanceof TransactionError)
    }
  )
}
