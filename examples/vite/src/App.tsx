import { LeapSwapWidget } from '@leapswap/widget'
import { createLeapSwapDataProvider } from '@leapswap/adapter-leapswap'

const swapDataProvider = createLeapSwapDataProvider()

export function App() {
  return (
    <LeapSwapWidget
      integrator="vite-example"
      swapDataProvider={swapDataProvider}
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
