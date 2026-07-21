# LeapSwap × OpenOcean example

默认使用 [`@leapswap/business-integrator`](../../packages/business-integrator) 接入 OpenOcean；侧边栏可切换到 **Custom** stub，练习自建 `SwapDataProvider` / `ChainsProvider`。

不依赖 KyberSwap。Kyber 独立示例见 [`../kyberswap`](../kyberswap)。

## 运行

```bash
# 仓库根目录
pnpm install
pnpm dev
# → http://localhost:3000
```

或：

```bash
pnpm --filter openocean-example dev --host
```

## 结构

```
src/
├── App.tsx
├── integrator/
│   ├── getIntegrator.ts    # openocean | custom 切换
│   ├── openOcean.ts        # 走 business-integrator
│   ├── custom.ts           # Custom stub
│   ├── chainsProvider.ts
│   └── README.md
└── providers/WalletProvider.tsx
```

Integrator 说明见 [`src/integrator/README.md`](./src/integrator/README.md)。
