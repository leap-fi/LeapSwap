# Example integrator（OpenOcean）

本示例（`examples/openocean`）支持两种数据源（侧边栏可切换，**默认 OpenOcean**）：


| 模式            | 说明                                                            |
| ------------- | ------------------------------------------------------------- |
| **OpenOcean** | 依赖 `@leapswap/business-integrator`，零配置                        |
| **Custom**    | 本目录 Custom stub（`custom.ts` / `chainsProvider.ts` 等），对接自有 API |


## 自建 integrator

1. 在 **Custom** 模式下编辑本目录下的 provider 实现；或
2. fork `[packages/business-integrator](../../../packages/business-integrator)` 为独立 npm 包；或
3. 参考 `[examples/kyberswap/src/integrator](../../kyberswap/src/integrator)` 在业务仓库内自建适配层。

Widget 必传：`SwapDataProvider`、`ChainsProvider`（类型见 `@leapswap/widget` / `@leapswap/widget-sdk`）。