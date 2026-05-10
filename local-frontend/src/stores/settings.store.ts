import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  serverUrl: string
  userId: string
  theme: 'light' | 'dark'
  setServerUrl: (url: string) => void
  setUserId: (id: string) => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      serverUrl: import.meta.env.VITE_LOCAL_SERVER_URL || 'http://localhost:8080',
      userId: import.meta.env.VITE_DEFAULT_USER_ID || '',
      theme: 'light',

      setServerUrl: (url) => set({ serverUrl: url }),
      setUserId: (id) => set({ userId: id }),
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        set({ theme })
      },
    }),
    { name: 'local-frontend-settings' },
  ),
)

export function initTheme() {
  const stored = localStorage.getItem('local-frontend-settings')
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { state?: { theme?: string } }
      if (parsed?.state?.theme === 'dark') {
        document.documentElement.classList.add('dark')
      }
    } catch {
      // ignore
    }
  }
}
