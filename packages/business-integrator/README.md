# @leapswap/business-integrator

**OpenOcean 参考实现** — 演示如何把第三方 API **适配**到 Widget 通用契约。接入方可直接依赖，也可只当作模板 fork。

同链数据注入是必选的；**本包不是唯一实现**。自建示例见 [`examples/kyberswap`](../../examples/kyberswap)（不依赖本包）。

## 职责边界

| 层 | 职责 |
|----|------|
| `@leapswap/widget` | 定义通用 `SwapDataProvider` / `ChainsProvider`，只消费规范化字段 |
| `@leapswap/business-integrator` | 把 OpenOcean v3/v4 请求/响应映射为上述通用字段（Solana `enabledDexIds` 等 quirks 留在本包） |
| 接入方自建包 / 示例 `integrator/` | 按同样契约对接自有 DEX / 聚合器（如 KyberSwap） |

## 导出

| API | 说明 |
|-----|------|
| `createOpenOceanDataProvider()` | 返回符合 Widget `SwapDataProvider` 的适配器 |
| `createOpenOceanChainsProvider()` | 返回 `ChainsProvider` |
| `normalizeOpenOceanQuote()` | OpenOcean 原始报价 → 通用 `SwapQuoteResult` |
| `OpenOceanSwapService` | OpenOcean HTTP 客户端（适配器内部使用） |

## 用法

```ts
import {
  createOpenOceanDataProvider,
  createOpenOceanChainsProvider,
} from '@leapswap/business-integrator'

const swapDataProvider = createOpenOceanDataProvider()
const chainsProvider = createOpenOceanChainsProvider()
```

完整 UI 示例：[`examples/openocean`](../../examples/openocean)。

## 自建 integrator

实现 `@leapswap/widget` 的 `SwapDataProvider`（见 `packages/widget/src/types/swapDataProvider.ts`），把你们后端字段映射成：

- 入参：`chainId` / `fromToken` / `toToken` / `amount`（最小单位）/ `slippage`（百分比字符串）
- 出参：`outAmount` / `estimatedGas` / `fromAmountUSD` / `toAmountUSD` / `transaction` / `approvalAddress` / `tool` 等
- 价格：`getTokensPrice` 或 token 列表上的 `priceUSD`（Widget 用其计算 Est. Gas Fee USD 与 Price impact）

不要让 Widget 去理解你们 API 的 `amountDecimals`、`approveContract`、`dexId`、`gasUsd` 等专有字段名——在 integrator 内先换成通用字段。
