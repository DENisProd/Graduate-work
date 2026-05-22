'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserStore } from '@/types';

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),

      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'smart-home-user',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
