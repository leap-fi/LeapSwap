import { Buffer } from 'buffer'
import process from 'process'

// Near / util 等依赖在浏览器环境需要 Node globals
const g = globalThis as typeof globalThis & {
  Buffer: typeof Buffer
  process: typeof process
  global: typeof globalThis
}

g.global = g
g.Buffer = Buffer
g.process = process
