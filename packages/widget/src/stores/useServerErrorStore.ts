import { create } from 'zustand'

export const useServerErrorStore = create<{
  error: string | null
  setError: (msg: string | null) => void
}>((set) => ({
  error: null,
  setError: (msg) => set({ error: msg }),
}))