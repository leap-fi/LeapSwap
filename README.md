# LeapSwap

可嵌入的跨链 Swap / Bridge Widget SDK。  
**目标**：用少量配置快速搭建**自有品牌**的交易界面——主题、Powered by、钱包入口、链与报价数据源均可按需定制，无需从零实现路由、签名与多链钱包逻辑。

## 项目背景

本仓库基于 **[LiFi Widget](https://github.com/lifinance/widget)** 改造而来：Widget UI、`widget-sdk` 路由执行、多链钱包集成等核心架构沿用 LiFi 体系；跨链仍聚合 LiFi、Relay、DeBridge 等协议。

同链 Swap 的报价与链列表通过 **`swapDataProvider` / `chainsProvider` 注入**，由接入方自己的 integrator 包提供（对接自有 DEX 或聚合 API）。仓库内 [`packages/business-integrator`](./packages/business-integrator) 仅作 **OpenOcean 参考实现**，示例工程不包含该依赖。

## 适用场景

- DApp / 交易所 / 钱包 App 内嵌 Swap 或 Bridge 模块
- 已有站点，希望加一块「换币 / 跨链」能力并保持 UI 风格一致
- 外层已有钱包连接（wagmi / Solana / Bitcoin），Widget 复用外部 Provider，不重复弹连接框

## 核心能力

| 能力 | 说明 |
|------|------|
| 白标 UI | `theme`、`variant` / `subvariant`、隐藏 `hiddenUI`、自定义 `poweredBy` |
| 数据注入 | 必传 `swapDataProvider`、`chainsProvider` — 由接入方 integrator 实现（参考 `business-integrator` 或 `examples/vite/src/integrator`） |
| 钱包协作 | 内置多链钱包菜单，或外层包 Provider + `walletConfig.onConnect` 接管连接 |
| 跨链路由 | `@leapswap/widget-sdk` 聚合 LiFi、Relay、DeBridge 等协议并执行交易 |

### 数据层：`swapDataProvider` 与 `chainsProvider`

| 注入项 | 谁来实现 | 说明 |
|--------|----------|------|
| **`swapDataProvider`** | 接入方 integrator | 实现通用 `SwapDataProvider`（入参/出参见 widget 类型；OpenOcean 字段映射放在 integrator 内） |
| **`chainsProvider`** | 接入方 integrator | `() => Promise<ExtendedChain[]>` |

Widget 只消费接口，不关心背后是 OpenOcean、自研聚合器还是某 DEX API。  
参考实现：[`@leapswap/business-integrator`](./packages/business-integrator)（`createOpenOceanDataProvider` / `createOpenOceanChainsProvider`）。

## 仓库结构

```
LeapSwap/
├── packages/
│   ├── widget/                 # @leapswap/widget — React UI 组件
│   ├── widget-sdk/             # @leapswap/widget-sdk — 路由、报价、执行
│   ├── wallet-management/      # @leapswap/wallet-management — 多链钱包与连接 UI
│   ├── widget-types/           # @leapswap/widget-types — 共享类型
│   └── business-integrator/    # OpenOcean 参考 integrator（可选，非 example 依赖）
├── examples/
│   └── vite/                   # 本地示例（src/integrator 占位，需自行实现）
├── scripts/
└── README.md
```

## 最小集成示例

```tsx
import { useMemo, useState } from 'react'
import { LeapSwapWidget } from '@leapswap/widget'
import { getIntegrator } from './integrator/getIntegrator'

export function App() {
  const [mode, setMode] = useState<'openocean' | 'custom'>('openocean')
  const { swapDataProvider, chainsProvider } = useMemo(
    () => getIntegrator(mode),
    [mode]
  )

  return (
    <LeapSwapWidget
      key={mode}
      integrator="your-app-id"
      swapDataProvider={swapDataProvider}
      chainsProvider={chainsProvider}
      /* ...theme, walletConfig, etc. */
    />
  )
}
```

在 `src/integrator/` 实现自有 provider，或 fork [`packages/business-integrator`](./packages/business-integrator)。本地示例页可切换 **OpenOcean（默认）** 与 **Custom** 两种模式，见 [`examples/vite`](./examples/vite)。

### 常用配置项

- **`config.theme`** — MUI 主题扩展
- **`config.poweredBy`** — 页脚品牌与跳转
- **`config.hiddenUI`** — 隐藏钱包菜单等模块
- **`walletConfig`** — 钱包参数；`usePartialWalletManagement` 支持内外钱包混用
- **`swapDataProvider` / `chainsProvider`** — 必传，由你的 integrator 提供

## 钱包：内置 vs 外层

Widget 会自动检测外层是否已有 `WagmiProvider`（EVM）、Solana `ConnectionContext`（SVM）、Bigmi（UTXO）：

- **未检测到外 Provider** → 使用 `@leapswap/wallet-management` 内置连接
- **检测到外 Provider** → 复用外层状态；`walletConfig.onConnect` 打开业务方连接 UI

## 快速开始（开发）

```bash
# 需要 Node >= 20，pnpm >= 9
pnpm install
pnpm dev
# → http://localhost:3000
```

`examples/vite` 通过 alias 直连 `packages/*/src`。发布前执行 `pnpm build`。

## 当前阶段

- [x] Monorepo 与 `@leapswap/*` 包骨架
- [x] 数据层接口抽离；OpenOcean 参考 integrator
- [x] `poweredBy`、钱包外层协作等白标能力
- [ ] 手续费收款地址、跨链 RPC 提成等全面可配置
- [ ] 替换上游 integrator id 等遗留硬编码
- [ ] npm 正式发布

## 计划发布的包

- `@leapswap/widget`
- `@leapswap/widget-sdk`
- `@leapswap/wallet-management`
- `@leapswap/widget-types`
- `@leapswap/business-integrator`（OpenOcean 参考，可选）
