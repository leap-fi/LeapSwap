import { LeapSwapWidget } from '@leapswap/widget'
import {
  createLeapSwapChainsProvider,
  createLeapSwapDataProvider,
} from '@leapswap/business-integrator'

const swapDataProvider = createLeapSwapDataProvider()
const chainsProvider = createLeapSwapChainsProvider()

export function App() {
  return (
    <LeapSwapWidget
      integrator="vite-example"
      swapDataProvider={swapDataProvider}
      chainsProvider={chainsProvider}
      config={{
        buildUrl: false,
        subvariant: 'split',
        subvariantOptions: {
          split: 'bridge',
        },
        theme: {
          container: {
            border: '1px solid rgb(234, 234, 234)',
            borderRadius: '16px',
          },
        },
      }}
    />
  )
}
