import type { Route } from '@leapswap/widget-sdk'
import type { BaseTransactionButtonProps } from '../../components/BaseTransactionButton/types.js'

export interface StartTransactionButtonProps
  extends BaseTransactionButtonProps {
  route?: Route
}
