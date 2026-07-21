# @leapswap/widget-sdk

LeapSwap cross-chain routing and execution SDK: quote orchestration, multi-chain step execution (EVM / Solana / Bitcoin UTXO / Near), balances, and status.  
Typically used via `@leapswap/widget`. You can also use it headlessly when you need route execution without the UI.

## Install

```bash
npm install @leapswap/widget-sdk
# or
pnpm add @leapswap/widget-sdk
```

Runtime / peer dependencies include `viem`, `@solana/web3.js`, and others — see `package.json`.

## Usage

```ts
import {
  createConfig,
  EVM,
  Solana,
  UTXO,
  getRoutes,
  executeRoute,
} from '@leapswap/widget-sdk'
```

When embedding the Widget, prefer configuring through `LeapSwapWidget`. Full UI examples live under `examples/` in the repo.

## Architecture notes

- Same-chain swap quotes are **not** hard-coded to a vendor API here; the Widget injects a `swapDataProvider`.
- Cross-chain still aggregates protocols such as LiFi, Relay, and DeBridge, and executes them in this package.
- Bitcoin (UTXO) clients use `@bigmi/core` **0.9+** (`createClient` + `publicActions`).

## Docs

- Repository: [leap-fi/LeapSwap](https://github.com/leap-fi/LeapSwap)
- Overview: [README](https://github.com/leap-fi/LeapSwap#readme)

## License

MIT
