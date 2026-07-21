# KyberSwap example integrator

独立示例：在本目录用 **KyberSwap Aggregator API v1** 实现 Widget 通用 `SwapDataProvider` / `ChainsProvider`。

不依赖 `@leapswap/business-integrator`。**不改 Widget** — 供应商差异留在本目录。

## API 映射

| Widget 契约 | KyberSwap / 本示例 |
|-------------|-------------------|
| `ChainsProvider` | `GET …/configurations/fetch?serviceCode=chains`（`logoUrl` → `logoURI`，`chainName` → Aggregator slug） |
| `getQuote` | `GET /{chain}/api/v1/routes?gasInclude=true`（含 `gas` / `gasUsd` / `amount*Usd`） |
| `getSwapQuote` | routes + `POST /{chain}/api/v1/route/build` |
| `getTokenList` / `getTokenInfo` | `ks-setting` `/api/v1/tokens` + DefiLlama 补 `priceUSD` |
| `getTokensPrice` | DefiLlama `coins.llama.fi`（Kyber token API 无价格；Widget 用 `priceUSD` 算 Gas USD / Price impact） |
| `getGasPrice` | 公共 RPC `eth_gasPrice` |
| `referrer.address` / `fee` | `feeReceiver` + `feeAmount`（bps）+ `chargeFeeBy=currency_in` |

浏览器直连会 CORS；Vite 代理：`/kyber-setting`、`/kyber-aggregator`、`/llama-prices`。

文档：https://docs.kyberswap.com/developer-guide/aggregator-api

可选环境变量：`VITE_KYBER_CLIENT_ID`（默认 `leapswap-kyberswap-example`）。

## 与 Widget 的对接要点

Widget 展示 Est. Gas Fee / Price impact 依赖：

1. 报价里的 `estimatedGas`（来自 routes 的 `gas`）
2. `getGasPrice`（本示例用公共 RPC）
3. 代币 / 原生币 `priceUSD`（Kyber token API 无价格，本示例用 DefiLlama 填）

不要把 Kyber 的 `gasUsd` 等字段名渗进 Widget；在本 integrator 内换成通用字段即可。
