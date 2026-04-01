'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserStore } from '@/types';

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,

      setUser: (user) => set({ user }),

      logout: () => set({ user: null }),
    }),
    {
      name: 'smart-home-user',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
