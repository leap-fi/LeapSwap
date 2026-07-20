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
      walletConfig={{
        onConnect: () => console.log('open your walletModal'),  // 把连接引导到外层 UI
      }}
      config={{
        buildUrl: false,
        hiddenUI: ['walletMenu'],  // 可选：彻底隐藏 Widget 内钱包入口
        poweredBy: { name: 'Your Brand', url: 'https://example.com' },
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
