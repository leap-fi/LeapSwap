# LeapSwap

可嵌入的跨链 Swap / Bridge Widget SDK。  
**目标**：用少量配置快速搭建**自有品牌**的交易界面——主题、Powered by、钱包入口、链与报价数据源均可按需定制，无需从零实现路由、签名与多链钱包逻辑。

## 项目背景

本仓库基于 **[LiFi Widget](https://github.com/lifinance/widget)** 改造而来：Widget UI、`widget-sdk` 路由执行、多链钱包集成等核心架构沿用 LiFi 体系；跨链仍聚合 LiFi、Relay、DeBridge 等协议。

同链 Swap 的报价与链列表通过 **`swapDataProvider` / `chainsProvider` 注入**，由接入方自己的 integrator 提供（对接自有 DEX 或聚合 API）。

**边界约定**：Widget / widget-sdk 只消费通用契约，不出现 OpenOcean、KyberSwap 等供应商字段名；映射全部放在 integrator（包或示例内 `src/integrator/`）。

## 适用场景

- DApp / 交易所 / 钱包 App 内嵌 Swap 或 Bridge 模块
- 已有站点，希望加一块「换币 / 跨链」能力并保持 UI 风格一致
- 外层已有钱包连接（wagmi / Solana / Bitcoin），Widget 复用外部 Provider，不重复弹连接框

## 核心能力

| 能力 | 说明 |
|------|------|
| 白标 UI | `theme`、`variant` / `subvariant`、隐藏 `hiddenUI`、自定义 `poweredBy` |
| 数据注入 | 必传 `swapDataProvider`、`chainsProvider` — 由接入方 integrator 实现 |
| 钱包协作 | 内置多链钱包菜单，或外层包 Provider + `walletConfig.onConnect` 接管连接 |
| 跨链路由 | `@leapswap/widget-sdk` 聚合 LiFi、Relay、DeBridge 等协议并执行交易 |

### 数据层：`swapDataProvider` 与 `chainsProvider`

| 注入项 | 谁来实现 | 说明 |
|--------|----------|------|
| **`swapDataProvider`** | 接入方 integrator | 通用 `SwapDataProvider`（类型见 `@leapswap/widget`） |
| **`chainsProvider`** | 接入方 integrator | `() => Promise<ExtendedChain[]>` |

两种参考接法：

| 方式 | 位置 | 说明 |
|------|------|------|
| 可复用包 | [`@leapswap/business-integrator`](./packages/business-integrator) | OpenOcean → 通用契约（`examples/openocean` 默认使用） |
| 示例内自建 | [`examples/kyberswap/src/integrator`](./examples/kyberswap/src/integrator) | KyberSwap Aggregator → 通用契约（**不**依赖 business-integrator） |

## 仓库结构

```
LeapSwap/
├── packages/
│   ├── widget/                 # @leapswap/widget — React UI
│   ├── widget-sdk/             # @leapswap/widget-sdk — 路由、执行
│   ├── wallet-management/      # @leapswap/wallet-management — 多链钱包
│   ├── widget-types/           # @leapswap/widget-types — 共享类型
│   └── business-integrator/    # OpenOcean 参考 integrator（可选依赖）
├── examples/
│   ├── openocean/              # OpenOcean（可切 Custom stub）
│   └── kyberswap/              # KyberSwap 自建 integrator
├── llms.txt                    # GEO：给 AI / 代理的文档索引（llmstxt.org）
├── llms-full.txt               # GEO：扩展上下文摘要
└── README.md
```
## 最小集成示例

```tsx
import { useMemo } from 'react'
import { LeapSwapWidget } from '@leapswap/widget'
import {
  createOpenOceanDataProvider,
  createOpenOceanChainsProvider,
} from '@leapswap/business-integrator'
// 或：从自建 integrator 导出 swapDataProvider / chainsProvider

export function App() {
  const swapDataProvider = useMemo(() => createOpenOceanDataProvider(), [])
  const chainsProvider = useMemo(() => createOpenOceanChainsProvider(), [])

  return (
    <LeapSwapWidget
      integrator="your-app-id"
      swapDataProvider={swapDataProvider}
      chainsProvider={chainsProvider}
      /* theme、walletConfig、poweredBy … */
    />
  )
}
```

本地完整示例：

- [`examples/openocean`](./examples/openocean) — 默认 OpenOcean + 侧边栏可切 Custom stub
- [`examples/kyberswap`](./examples/kyberswap) — 纯自建 KyberSwap integrator（证明任意聚合器可插）

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
# Node >= 20；本仓库 packageManager 为 pnpm@10
pnpm install
pnpm dev                 # OpenOcean 示例 → http://localhost:3000
pnpm dev:kyberswap       # KyberSwap 示例 → http://localhost:3001
```

示例通过 Vite alias 直连 `packages/*/src`。发布前执行 `pnpm build`。

## 当前阶段

- [x] Monorepo 与 `@leapswap/*` 包骨架
- [x] 同链数据层接口抽离（`SwapDataProvider` / `ChainsProvider`）
- [x] OpenOcean 参考 integrator（`business-integrator`）+ `examples/openocean` 联调通过
- [x] KyberSwap 自建 integrator 示例（`examples/kyberswap`）联调通过
- [x] `poweredBy`、钱包外层协作等白标能力
- [x] GEO：根目录 `llms.txt` / `llms-full.txt`（便于 AI 正确引用架构约定）
- [ ] npm 正式发布

## AI / GEO

面向生成式引擎与编码代理（[llms.txt 规范](https://llmstxt.org/)）：

- [`llms.txt`](./llms.txt) — 精简索引（优先读这个）
- [`llms-full.txt`](./llms-full.txt) — 接入规则与边界的扩写版

## 计划发布的包

- `@leapswap/widget`
- `@leapswap/widget-sdk`
- `@leapswap/wallet-management`
- `@leapswap/widget-types`
- `@leapswap/business-integrator`（OpenOcean 参考，可选）
