# LeapSwap

可嵌入的跨链 Swap / Bridge Widget SDK。  
**目标**：用少量配置快速搭建**自有品牌**的交易界面——主题、Powered by、钱包入口、链与报价数据源均可按需定制，无需从零实现路由、签名与多链钱包逻辑。

## 项目背景

本仓库基于 **[LiFi Widget](https://github.com/lifinance/widget)** 改造而来：Widget UI、`widget-sdk` 路由执行、多链钱包集成等核心架构沿用 LiFi 体系；跨链仍聚合 LiFi、Relay、DeBridge 等协议。

在此基础上做了白标化与数据层抽离——同链 Swap 的报价与链列表不再写死在 Widget 内，而是通过 `swapDataProvider`、`chainsProvider` 注入。**开箱默认**由 `[@leapswap/business-integrator](./packages/business-integrator)` 对接 **OpenOcean API**；接入方可改为自己的后端，或实现接口完全替换。

## 适用场景

- DApp / 交易所 / 钱包 App 内嵌 Swap 或 Bridge 模块
- 已有站点，希望加一块「换币 / 跨链」能力并保持 UI 风格一致
- 外层已有钱包连接（wagmi / Solana / Bitcoin），Widget 复用外部 Provider，不重复弹连接框



## 核心能力


| 能力    | 说明                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------- |
| 白标 UI | `theme`、`variant` / `subvariant`、隐藏 `hiddenUI`、自定义 `poweredBy`                                     |
| 数据注入  | `swapDataProvider`（同链报价）、`chainsProvider`（支持链列表）；开箱默认 OpenOcean 参考实现，自建 API 请实现 `SwapDataProvider` |
| 钱包协作  | 内置多链钱包菜单，或外层包 Provider + `walletConfig.onConnect` 接管连接                                             |
| 跨链路由  | `@leapswap/widget-sdk` 聚合 LiFi、Relay、DeBridge 等协议并执行交易                                             |




### 数据层：`swapDataProvider` 与 `chainsProvider`


| 注入项                | 默认（零配置）                                                                | 换成自己的                                              |
| ------------------ | ---------------------------------------------------------------------- | -------------------------------------------------- |
| `swapDataProvider` | `createLeapSwapDataProvider()` — 内置 OpenOcean 适配（v3/v4 等细节在包内，不暴露给接入方） | 自行实现 `@leapswap/widget` 的 `SwapDataProvider` 接口并传入 |
| `chainsProvider`   | `createLeapSwapChainsProvider()` — 内置 OpenOcean 链列表                    | 传 `getChains: () => fetchMyChains()` 完全自定义         |


二者为 **必传注入**（或 chains 传静态列表）：Widget 只消费 `SwapDataProvider` / `ChainsProvider` 接口，不关心背后是 OpenOcean 还是你的服务。

## 仓库结构

```
LeapSwap/
├── packages/
│   ├── widget/                 # @leapswap/widget — React UI 组件
│   ├── widget-sdk/             # @leapswap/widget-sdk — 路由、报价、执行
│   ├── wallet-management/      # @leapswap/wallet-management — 多链钱包与连接 UI
│   ├── widget-types/           # @leapswap/widget-types — 共享类型
│   └── business-integrator/    # @leapswap/business-integrator — Swap / Chains 业务数据层
├── examples/
│   └── vite/                   # 本地集成示例
├── scripts/                    # 构建 / 发布辅助脚本
└── README.md
```



## 最小集成示例

```tsx
import { LeapSwapWidget } from '@leapswap/widget'
import {
  createLeapSwapChainsProvider,
  createLeapSwapDataProvider,
} from '@leapswap/business-integrator'

const swapDataProvider = createLeapSwapDataProvider()
const chainsProvider = createLeapSwapChainsProvider()
// 自建 API：实现 SwapDataProvider 后 swapDataProvider={myProvider}
// 自定义链列表：createLeapSwapChainsProvider({ getChains: () => fetchMyChains() })

export function App() {
  return (
    <LeapSwapWidget
      integrator="your-app-id"
      swapDataProvider={swapDataProvider}
      chainsProvider={chainsProvider}
      walletConfig={{
        // 外层已有钱包时，把「连接」引导到自己的 Modal
        onConnect: () => openYourWalletModal(),
      }}
      config={{
        hiddenUI: ['walletMenu'],
        poweredBy: { name: 'Your Brand', url: 'https://example.com' },
        subvariant: 'split',
        subvariantOptions: { split: 'bridge' },
        theme: {
          container: { borderRadius: '16px' },
        },
      }}
    />
  )
}
```

完整可运行示例见 `[examples/vite](./examples/vite)`。

### 常用配置项

- `**config.theme**` — MUI 主题扩展，改色、圆角、排版等
- `**config.poweredBy**` — 页脚品牌与跳转链接（`'default'` / `'jumper'` 或自定义 `{ name, url }`）
- `**config.hiddenUI**` — 隐藏钱包菜单、历史、语言等模块
- `**walletConfig**` — WalletConnect / MetaMask / Coinbase 参数；`usePartialWalletManagement` 支持内外钱包混用
- `swapDataProvider` **/** `chainsProvider` — 默认零配置 OpenOcean 参考实现；自建请实现 `SwapDataProvider` 或 `getChains`（见上文「数据层」）



## 钱包：内置 vs 外层

Widget 会自动检测外层是否已有 `WagmiProvider`（EVM）、Solana `ConnectionContext`（SVM）、Bigmi（UTXO）：

- **未检测到外 Provider** → Widget 使用 `@leapswap/wallet-management` 内置连接流程
- **检测到外 Provider** → 复用外层连接状态，默认隐藏 Widget 内钱包菜单；可通过 `walletConfig.onConnect` 打开业务方自己的连接 UI



## 快速开始（开发）

```bash
# 需要 Node >= 20，pnpm >= 9
pnpm install
pnpm dev
# → http://localhost:3000
```

`examples/vite` 通过 alias 直接编译 `packages/*/src`，改 widget / sdk 会热更新。  
**发布到 npm 前**需执行 `pnpm build` 产出各包 `dist/`。

## 当前阶段

- [x] Monorepo 与 `@leapswap/*` 包骨架
- [x] Swap / Chains 数据层抽离至 `business-integrator`
- [x] `poweredBy`、钱包外层协作等白标能力
- [ ] 手续费收款地址、跨链 RPC 提成等全面可配置
- [ ] 替换上游 API 域名、integrator id 等遗留硬编码
- [ ] npm 正式发布



## 计划发布的包

- `@leapswap/widget`
- `@leapswap/widget-sdk`
- `@leapswap/wallet-management`
- `@leapswap/widget-types`
- `@leapswap/business-integrator`

