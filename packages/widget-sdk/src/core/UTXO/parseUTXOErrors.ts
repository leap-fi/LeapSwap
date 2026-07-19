import type { LeapSwapStep } from '@leapswap/widget-types'
import { SDKError } from '../../errors/SDKError.js'
import { BaseError } from '../../errors/baseError.js'
import { ErrorMessage, LeapSwapErrorCode } from '../../errors/constants.js'
import { TransactionError, UnknownError } from '../../errors/errors.js'
import type { Process } from '../types.js'

export const parseUTXOErrors = async (
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
  // txn-mempool-conflict
  if (
    e.details?.includes?.('conflict') ||
    e.cause?.message?.includes?.('conflict')
  ) {
    return new TransactionError(
      LeapSwapErrorCode.TransactionConflict,
      'Your transaction conflicts with another transaction already in the mempool. One or more inputs have been spent by another transaction.',
      e
    )
  }
  if (e.code === 4001 || e.code === -32000 || e.cause?.includes?.('rejected')) {
    return new TransactionError(
      LeapSwapErrorCode.SignatureRejected,
      e.message,
      e
    )
  }
  if (e.code === -5 || e.code === -32700 || e.code === -32064) {
    return new TransactionError(LeapSwapErrorCode.NotFound, e.message, e)
  }

  if (e instanceof BaseError) {
    return e
  }

  return new UnknownError(e.message || ErrorMessage.UnknownError, e)
}
