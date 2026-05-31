import { create } from 'zustand'
import type { ZigbeeState } from '@/types'

interface DeviceStatesStore {
  states: Map<string, ZigbeeState>
  setDeviceState: (ieeeAddr: string, state: ZigbeeState) => void
  clearStates: () => void
}

export const useDeviceStatesStore = create<DeviceStatesStore>((set) => ({
  states: new Map(),

  setDeviceState: (ieeeAddr, state) =>
    set((s) => {
      const next = new Map(s.states)
      next.set(ieeeAddr, state)
      return { states: next }
    }),

  clearStates: () => set({ states: new Map() }),
}))
