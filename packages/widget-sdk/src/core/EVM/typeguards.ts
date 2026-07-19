import type { LeapSwapStep } from '@leapswap/widget-types'
import type { LeapSwapStepExtended } from '../types.js'

type RelayerStep = (LeapSwapStepExtended | LeapSwapStep) & {
  typedData: NonNullable<(LeapSwapStepExtended | LeapSwapStep)['typedData']>
}

export function isRelayerStep(
  step: LeapSwapStepExtended | LeapSwapStep
): step is RelayerStep {
  return !!step.typedData && step.typedData.length > 0
}

export function isGaslessStep(
  step: LeapSwapStepExtended | LeapSwapStep
): step is RelayerStep {
  return !!step.typedData?.find(
    (p) => p.primaryType === 'PermitWitnessTransferFrom'
  )
}
