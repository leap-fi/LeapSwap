import type { BoxProps } from '@mui/material'
import type { LeapSwapStep, Step } from '@leapswap/widget-sdk'
import type {
  SubvariantOptions,
  WidgetFeeConfig,
  WidgetSubvariant,
} from '../../types/widget.js'

export interface StepActionsProps extends BoxProps {
  step: LeapSwapStep
  dense?: boolean
}

export interface StepDetailsLabelProps {
  step: Step
  subvariant?: Extract<WidgetSubvariant, 'custom'>
  subvariantOptions?: SubvariantOptions
  feeConfig?: WidgetFeeConfig
  relayerSupport?: boolean
}

export interface IncludedStepsProps {
  step: LeapSwapStep
}
