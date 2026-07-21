import { Buffer } from 'buffer'
import process from 'process'

const g = globalThis as typeof globalThis & {
  Buffer: typeof Buffer
  process: typeof process
  global: typeof globalThis
}

g.global = g
g.Buffer = Buffer
g.process = process
