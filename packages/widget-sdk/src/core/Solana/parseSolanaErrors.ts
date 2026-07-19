import type { LeapSwapStep } from '@leapswap/widget-types'
import { SDKError } from '../../errors/SDKError.js'
import { BaseError } from '../../errors/baseError.js'
import { ErrorMessage, LeapSwapErrorCode } from '../../errors/constants.js'
import { TransactionError, UnknownError } from '../../errors/errors.js'
import type { Process } from '../types.js'

export const parseSolanaErrors = async (
  e: Error,
  step?: LeapSwapStep,
  process?: Process
): Promise<SDKError> => {
  if (e instanceof SDKError) {
    e.step = e.step ?? step
    e.process = e.process ?? process
    return e
  }

  const baseError = handleSpecificErrors(e)

  return new SDKError(baseError, step, process)
}

const handleSpecificErrors = (e: any) => {
  if (e.name === 'WalletSignTransactionError') {
    return new TransactionError(
      LeapSwapErrorCode.SignatureRejected,
      e.message,
      e
    )
  }

  if (e.name === 'SendTransactionError') {
    return new TransactionError(
      LeapSwapErrorCode.TransactionFailed,
      e.message,
      e
    )
  }

  if (e.name === 'TransactionExpiredBlockheightExceededError') {
    return new TransactionError(
      LeapSwapErrorCode.TransactionExpired,
      e.message,
      e
    )
  }

  if (e.message?.includes('simulate')) {
    return new TransactionError(
      LeapSwapErrorCode.TransactionSimulationFailed,
      e.message,
      e
    )
  }

  if (e instanceof BaseError) {
    return e
  }

  return new UnknownError(e.message || ErrorMessage.UnknownError, e)
}
