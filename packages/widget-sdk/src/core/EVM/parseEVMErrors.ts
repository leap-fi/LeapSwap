import type { LeapSwapStep } from '@leapswap/widget-types'
import { SDKError } from '../../errors/SDKError.js'
import { BaseError } from '../../errors/baseError.js'
import { ErrorMessage, LeapSwapErrorCode } from '../../errors/constants.js'
import { TransactionError, UnknownError } from '../../errors/errors.js'
import { fetchTxErrorDetails } from '../../utils/fetchTxErrorDetails.js'
import type { Process } from '../types.js'

export const parseEVMErrors = async (
  e: Error,
  step?: LeapSwapStep,
  process?: Process
): Promise<SDKError> => {
  if (e instanceof SDKError) {
    e.step = e.step ?? step
    e.process = e.process ?? process
    return e
  }

  const baseError = await handleSpecificErrors(e, step, process)

  return new SDKError(baseError, step, process)
}

const handleSpecificErrors = async (
  e: any,
  step?: LeapSwapStep,
  process?: Process
) => {
  if (
    e.name === 'UserRejectedRequestError' ||
    e.cause?.name === 'UserRejectedRequestError'
  ) {
    return new TransactionError(
      LeapSwapErrorCode.SignatureRejected,
      e.message,
      e
    )
  }
  // Safe Wallet via WalletConnect returns -32000 code when user rejects the signature
  // {
  //   code: -32000,
  //   message: 'User rejected transaction',
  // }
  if (
    e.cause?.code === -32000 ||
    // Safe doesn't return proper code, but the error details includes 'rejected'
    (e.name === 'TransactionExecutionError' &&
      e.cause?.details?.includes('rejected'))
  ) {
    return new TransactionError(
      LeapSwapErrorCode.SignatureRejected,
      e.message,
      e
    )
  }
  // Some wallets reject transactions sometimes with this code because of internal and JSON-RPC errors, e.g.:
  // {
  //     "code": -32603,
  //     "message": "Pop up window failed to open",
  //     "docUrl": "https://docs.cloud.coinbase.com/wallet-sdk/docs/errors"
  // }
  if (e.cause?.code === -32603) {
    return new TransactionError(
      LeapSwapErrorCode.TransactionRejected,
      e.message,
      e
    )
  }

  if (
    step &&
    process?.txHash &&
    e.code === LeapSwapErrorCode.TransactionFailed &&
    e.message === ErrorMessage.TransactionReverted
  ) {
    const response = await fetchTxErrorDetails(
      process.txHash,
      step.action.fromChainId
    )

    const errorMessage = response?.error_message

    if (errorMessage?.toLowerCase().includes('out of gas')) {
      return new TransactionError(
        LeapSwapErrorCode.GasLimitError,
        ErrorMessage.GasLimitLow,
        e
      )
    }
  }

  if (e instanceof BaseError) {
    return e
  }

  return new UnknownError(e.message || ErrorMessage.UnknownError, e)
}
