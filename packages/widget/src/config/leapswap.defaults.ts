/**
 * LeapSwap 上游默认值（暂时保留）。
 *
 * ⚠️ 提醒：这些是 LeapSwap 的收款 / 标识默认值，不是 LeapSwap 的。
 * 下一步会把它们提升为 WidgetConfig（feeRecipient / referrer / rpcUrls），
 * 发布白标 widget 前必须替换。详见仓库根目录 NOTICE.md。
 *
 * TODO(leapswap-config):
 * - [ ] 由 WidgetConfig.feeRecipient.evm / .solana 覆盖
 * - [ ] 同链 quote/swap 的 referrer 回退改用配置，禁止静默落到下方地址
 * - [ ] 跨链 adapters 注入配置，不再 import 本文件常量作为最终收款方
 */

/** @deprecated Use config.feeRecipient.evm — LeapSwap cross-chain fee receiver */
export const LEAPSWAP_CROSS_CHAIN_FEE_RECEIVER_EVM =
  '0x922164BBBd36Acf9E854AcBbF32faCC949fCAEef'

/** @deprecated Use config.feeRecipient.solana — LeapSwap Solana fee receiver */
export const LEAPSWAP_CROSS_CHAIN_FEE_RECEIVER_SOLANA =
  'yEVG5DpokLuVRAqoWeKJANBY2wynzgTSXUbGz7aDKBq'

/** @deprecated Use config.referrer.address — LeapSwap same-chain referrer fallback */
export const LEAPSWAP_DEFAULT_REFERRER =
  '0x3487ef9f9b36547e43268b8f0e2349a226c70b53'
