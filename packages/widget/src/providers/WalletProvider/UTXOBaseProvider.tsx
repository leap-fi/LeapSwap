import { BigmiProvider, useReconnect } from '@bigmi/react'
import type { DefaultWagmiConfigResult } from '@leapswap/wallet-management'
import { createDefaultBigmiConfig } from '@leapswap/wallet-management'
import { type FC, type PropsWithChildren, useRef } from 'react'

export const UTXOBaseProvider: FC<PropsWithChildren> = ({ children }) => {
  const bigmi = useRef<DefaultWagmiConfigResult>(null)

  if (!bigmi.current) {
    bigmi.current = createDefaultBigmiConfig({
      bigmiConfig: {
        ssr: true,
        multiInjectedProviderDiscovery: false,
      },
    })
  }

  useReconnect(bigmi.current.config)

  return (
    <BigmiProvider config={bigmi.current.config} reconnectOnMount={false}>
      {children}
    </BigmiProvider>
  )
}
