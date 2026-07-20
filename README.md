# LeapSwap

可配置的跨链 Swap / Bridge Widget SDK。  
目标：少量配置即可搭建交易界面，并支持自定义手续费收款地址与 RPC。

## 仓库结构

```
LeapSwap/
├── packages/
│   ├── widget/              # @leapswap/widget — UI Widget
│   ├── widget-sdk/          # @leapswap/widget-sdk — 报价与执行
│   ├── wallet-management/   # @leapswap/wallet-management
│   └── widget-types/        # @leapswap/widget-types
├── examples/
│   └── vite/                # 本地验证示例
├── scripts/                 # 构建 / 发布辅助脚本
├── NOTICE.md                # OpenOcean / 重命名提醒
├── README.md
└── docs/STEPS.md
```

## 当前阶段

**Step 1 — 项目初始化（进行中）**

- [x] monorepo 骨架
- [x] 从 OpenOcean 拷贝核心包并重命名为 `@leapswap/*`
- [ ] `pnpm install` + 本地 example 跑通（本步验证）
- [ ] 下一步：手续费 / RPC 提成可配置（见 NOTICE）

## 快速开始（开发：无需先 build 四个包）

```bash
# 需要 Node >= 20，pnpm >= 9
pnpm install
pnpm dev
# → http://localhost:3000
```

`examples/vite` 已配置 alias，直接编译 `packages/*/src`，改 widget/sdk 会热更新。  
**发布到 npm 前**仍需 `pnpm build` 产出 dist。

## npm 发布目标

后续发布到：https://www.npmjs.com/settings/leapswap/packages

计划包名：

- `@leapswap/widget`
- `@leapswap/widget-sdk`
- `@leapswap/wallet-management`
- `@leapswap/widget-types`
