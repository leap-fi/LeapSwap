import { useSplitSubvariantStore } from '../stores/settings/useSplitSubvariantStore.js'
import { useWidgetConfig } from '../providers/WidgetProvider/WidgetProvider.js'


export const useSwapOnly = () => {
  const { subvariant } = useWidgetConfig()
  const [state, setState] = useSplitSubvariantStore((storeState) => [storeState.state, storeState.setState])
  if (subvariant === 'swap' && state !== 'swap') {
    setState('swap')
    return true
  }
  return state === 'swap' || subvariant === 'swap'
}
