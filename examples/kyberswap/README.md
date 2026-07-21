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

## 结构

```
src/
├── App.tsx
├── integrator/
│   ├── createKyberSwapDataProvider.ts  # SwapDataProvider
│   ├── chainsProvider.ts               # Kyber Setting chains API
│   ├── constants.ts
│   └── README.md
└── providers/WalletProvider.tsx
```

说明见 [`src/integrator/README.md`](./src/integrator/README.md)。
