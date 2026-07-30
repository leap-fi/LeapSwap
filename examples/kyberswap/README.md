# LeapSwap × KyberSwap example

独立示例：在 `src/integrator/` **自行实现** KyberSwap Aggregator API → Widget 通用契约。

- 不放入 `examples/openocean`
- **不**依赖 `@leapswap/business-integrator`
- **不**改 Widget：供应商字段映射只在本目录

## 运行

```bash
# 仓库根目录
pnpm install
pnpm dev:kyberswap
# → http://localhost:3001
```

或：

```bash
pnpm --filter kyberswap-example dev --host
```

## 国际化联动

外层用自己的 `i18next`；切换语言时把同一 locale 传给 Widget：

```ts
config={{
  languages: { default: locale, allow: ['en', 'zh'] },
  hiddenUI: ['walletMenu', 'language'], // 语言由外层控制
}}
```

Widget 内部另有独立 i18n 实例，**不能**共享 host 的 i18n；靠 `languages.default` 同步。

## 结构

```
src/
├── App.tsx
├── i18n/                       # 外层文案 + i18next
├── components/
│   ├── LanguageSwitcher.tsx
│   └── WalletHeader.tsx
├── integrator/
│   ├── createKyberSwapDataProvider.ts
│   ├── chainsProvider.ts
│   ├── constants.ts
│   └── README.md
└── providers/WalletProvider.tsx
```

说明见 [`src/integrator/README.md`](./src/integrator/README.md)。
