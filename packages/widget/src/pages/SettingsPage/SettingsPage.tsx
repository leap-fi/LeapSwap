import { useTranslation } from 'react-i18next'
import { PageContainer } from '../../components/PageContainer.js'
import { useHeader } from '../../hooks/useHeader.js'
import { ResetSettingsButton } from './ResetSettingsButton.js'
import { SettingsList } from './SettingsCard/SettingCard.style.js'
import { SettingsCardAccordion } from './SettingsCard/SettingsAccordian.js'
import { SlippageSettings } from './SlippageSettings/SlippageSettings.js'
import { DynamicSlippageSettings } from './DynamicSlippageSettings.js'

export const SettingsPage = () => {
  const { t } = useTranslation()
  useHeader(t('translation:header.settings', 'Settings'))

  return (
    <PageContainer bottomGutters>
      <SettingsList>
        <SettingsCardAccordion>
          {/* <ThemeSettings /> */}
          {/* <LanguageSetting /> */}
          {/* <RoutePrioritySettings /> */}
          {/* <GasPriceSettings /> */}
          <DynamicSlippageSettings />
          <SlippageSettings />
          {/* <BridgeAndExchangeSettings type="Bridges" />
          <BridgeAndExchangeSettings type="Exchanges" /> */}
        </SettingsCardAccordion>
      </SettingsList>
      <ResetSettingsButton />
    </PageContainer>
  )
}
