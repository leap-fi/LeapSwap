import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useWidgetConfig } from '../../providers/WidgetProvider/WidgetProvider.js'
import { useFieldActions } from '../../stores/form/useFieldActions.js'
import { useFieldValues } from '../../stores/form/useFieldValues.js'
import { useSplitSubvariantStore } from '../../stores/settings/useSplitSubvariantStore.js'
import { HeaderAppBar } from '../Header/Header.style.js'
import { Tab, Tabs } from '../Tabs/Tabs.style.js'
import { useServerErrorStore } from '../../stores/useServerErrorStore.js'

export const NavigationTabs = () => {
  const { subvariant } = useWidgetConfig()

  const { t } = useTranslation()
  const [state, setState] = useSplitSubvariantStore((storeState) => [
    storeState.state,
    storeState.setState,
  ])
  const [fromChain, toChain] = useFieldValues('fromChain', 'toChain')
  const initialLoadDoneRef = useRef(false)

  // useEffect(() => {
  //   if (
  //     fromChain !== undefined &&
  //     fromChain !== null &&
  //     toChain !== undefined &&
  //     toChain !== null &&
  //     !initialLoadDoneRef.current
  //   ) {
  //     if (subvariant === 'bridge') {
  //       setState('bridge')
  //     } else {
  //       const newState: 'swap' | 'bridge' =
  //         fromChain === toChain ? 'swap' : 'bridge'
  //       setState(newState)
  //     }
  //     initialLoadDoneRef.current = true
  //   }
  // }, [fromChain, toChain, setState])

  const { setFieldValue } = useFieldActions()
  const handleChange = (_: React.SyntheticEvent, value: number) => {
    setFieldValue('fromAmount', '')
    setFieldValue('fromToken', '')
    setFieldValue('toToken', '')
    const newState: 'swap' | 'bridge' = value === 0 ? 'swap' : 'bridge'
    setState(newState)
    useServerErrorStore.getState().setError(null)
  }

  return (
    <HeaderAppBar elevation={0} sx={{ paddingTop: 1, paddingBottom: 0.5 }}>
      <Tabs
        value={state === 'swap' ? 0 : 1}
        onChange={handleChange}
        aria-label="tabs"
        indicatorColor="primary"
      >
        <Tab label={t('header.swap')} disableRipple />
        <Tab label={t('header.bridge')} disableRipple />
      </Tabs>
    </HeaderAppBar>
  )

  // return null
}
