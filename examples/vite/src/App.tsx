import { LeapSwapWidget } from '@leapswap/widget'

export function App() {
  return (
    <LeapSwapWidget
      integrator="vite-example"
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
