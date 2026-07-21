# @leapswap/widget-types

Shared types and constants for LeapSwap: chains, tokens, route steps, quote-related types, and more.  
Usually consumed transitively by `@leapswap/widget-sdk` and `@leapswap/widget`. Install this package directly only if your own integrator needs aligned types.

## Install

```bash
npm install @leapswap/widget-types
# or
pnpm add @leapswap/widget-types
```

## Usage

```ts
import type { ExtendedChain, Token, TokenAmount } from '@leapswap/widget-types'
import { ChainId, ChainType } from '@leapswap/widget-types'
```

## Docs

- Repository: [leap-fi/LeapSwap](https://github.com/leap-fi/LeapSwap)
- Overview: [README](https://github.com/leap-fi/LeapSwap#readme)
- Publish guide: [`docs/PUBLISH.md`](https://github.com/leap-fi/LeapSwap/blob/master/docs/PUBLISH.md)

## License

MIT
