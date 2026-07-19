import { WarningRounded } from '@mui/icons-material'
import { Box, Typography, debounce } from '@mui/material'
import type { ChangeEventHandler, FocusEventHandler } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingMonitor } from '../../../hooks/useSettingMonitor.js'
import { useSettings } from '../../../stores/settings/useSettings.js'
import { useSettingsActions } from '../../../stores/settings/useSettingsActions.js'
import { defaultSlippage } from '../../../stores/settings/useSettingsStore.js'
import { formatSlippage } from '../../../utils/format.js'
import { BadgedValue } from '../SettingsCard/BadgedValue.js'
import { SettingCardExpandable } from '../SettingsCard/SettingCardExpandable.js'
import {
  SettingsFieldSet,
  SlippageCustomInput,
  SlippageDefaultButton,
  SlippageLimitsWarningContainer,
} from './SlippageSettings.style.js'

const DEFAULT_CUSTOM_INPUT_VALUE = '0.5'
const list = [
  {
    name: '0.5%',
    value: '0.5',
  },
  {
    name: '1%',
    value: '1',
  },
  {
    name: '3%',
    value: '3',
  },
]

export const SlippageSettings: React.FC = () => {
  const { t } = useTranslation()
  const {
    isSlippageNotRecommended,
    isSlippageUnderRecommendedLimits,
    isSlippageOutsideRecommendedLimits,
    isSlippageChanged,
  } = useSettingMonitor()
  const { slippage } = useSettings(['slippage'])
  const { setValue } = useSettingsActions()
  const defaultValue = useRef(slippage)
  const [focused, setFocused] = useState<'input' | 'button'>()

  const customInputValue =
    !slippage || slippage === defaultSlippage
      ? DEFAULT_CUSTOM_INPUT_VALUE
      : slippage

  const [inputValue, setInputValue] = useState(customInputValue)

  const handleDefaultClick = (value: string) => {
    setValue('slippage', value)
    setInputValue('')
  }

  const debouncedSetValue = useMemo(() => debounce(setValue, 500), [setValue])

  const handleInputUpdate: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const { value } = event.target

      const formattedValue = formatSlippage(value, defaultValue.current, true)

      setInputValue(formattedValue)
      debouncedSetValue(
        'slippage',
        formattedValue.length ? formattedValue : defaultSlippage
      )
    },
    [debouncedSetValue]
  )

  const handleInputFocus: FocusEventHandler<HTMLInputElement> = (event) => {
    setFocused('input')

    const { value } = event.target

    const formattedValue = formatSlippage(value, defaultValue.current)
    setInputValue(formattedValue)
    setValue(
      'slippage',
      formattedValue.length ? formattedValue : defaultSlippage
    )
  }

  const badgeColor = isSlippageNotRecommended
    ? 'warning'
    : isSlippageChanged
      ? 'info'
      : undefined

  const slippageWarningText = isSlippageOutsideRecommendedLimits
    ? t('warning.message.slippageOutsideRecommendedLimits')
    : isSlippageUnderRecommendedLimits
      ? t('warning.message.slippageUnderRecommendedLimits')
      : ''

  return (
    <SettingCardExpandable
      value={
        <BadgedValue badgeColor={badgeColor} showBadge={!!badgeColor}>
          {slippage ? `${slippage}%` : t('button.auto')}
        </BadgedValue>
      }
      icon={null}
      title={t('settings.slippage')}
    >
      <Box
        sx={{
          mt: 1.5,
        }}
      >
        <SettingsFieldSet>
          {list.map((item, i) => (
            <SlippageDefaultButton
              key={i}
              selected={item.value === slippage && focused !== 'input'}
              onFocus={() => {
                setFocused('button')
              }}
              onBlur={() => {
                setFocused(undefined)
              }}
              onClick={() => handleDefaultClick(item.value)}
              disableRipple
            >
              {item.name}
            </SlippageDefaultButton>
          ))}

          <SlippageCustomInput
            selected={true}
            placeholder={focused === 'input' ? '' : t('settings.custom')}
            inputProps={{
              inputMode: 'decimal',
            }}
            onChange={handleInputUpdate}
            onFocus={handleInputFocus}
            value={inputValue}
            autoComplete="off"
            onBlur={() => setFocused(undefined)}
          />
        </SettingsFieldSet>
        {isSlippageNotRecommended && (
          <SlippageLimitsWarningContainer>
            <WarningRounded color="warning" />
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 400,
              }}
            >
              {slippageWarningText}
            </Typography>
          </SlippageLimitsWarningContainer>
        )}
      </Box>
    </SettingCardExpandable>
  )
}
