import { useWidgetConfig } from '../providers/WidgetProvider/WidgetProvider.js'

export function useIntegratorCacheKey(): string | undefined {
  const { dataSourceKey, formUpdateKey } = useWidgetConfig()
  return dataSourceKey ?? formUpdateKey
}
