import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppLocale } from '@/i18n/messages'

function browserDefaultLocale(): AppLocale {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

interface SettingsState {
  serverUrl: string
  /** Base URL of NestJS access-service (houses, RBAC). Empty → VITE_ACCESS_SERVICE_URL. */
  accessServiceUrl: string
  userId: string
  authSessionId: string
  authUserCode: string
  authVerificationUrl: string
  authStatus: string
  authCode: string
  authExternalUserId: string
  authDisplayName: string
  authExpiresAt: string
  isAuthPolling: boolean
  /** Active house for UI context (sidebar, etc.) */
  currentHouseId: string
  currentHouseName: string
  theme: 'light' | 'dark'
  locale: AppLocale
  setServerUrl: (url: string) => void
  setAccessServiceUrl: (url: string) => void
  setUserId: (id: string) => void
  setAuthState: (patch: Partial<Pick<
    SettingsState,
    | 'authSessionId'
    | 'authUserCode'
    | 'authVerificationUrl'
    | 'authStatus'
    | 'authCode'
    | 'authExternalUserId'
    | 'authDisplayName'
    | 'authExpiresAt'
    | 'isAuthPolling'
  >>) => void
  resetAuthState: () => void
  setCurrentHouse: (id: string, name: string) => void
  clearCurrentHouse: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setLocale: (locale: AppLocale) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      serverUrl: import.meta.env.VITE_LOCAL_SERVER_URL || 'http://localhost:8080',
      accessServiceUrl: (import.meta.env.VITE_ACCESS_SERVICE_URL as string | undefined)?.trim() || '',
      userId: import.meta.env.VITE_DEFAULT_USER_ID || '',
      authSessionId: '',
      authUserCode: '',
      authVerificationUrl: '',
      authStatus: '',
      authCode: '',
      authExternalUserId: '',
      authDisplayName: '',
      authExpiresAt: '',
      isAuthPolling: false,
      currentHouseId: '',
      currentHouseName: '',
      theme: 'light',
      locale: browserDefaultLocale(),

      setServerUrl: (url) => set({ serverUrl: url }),
      setAccessServiceUrl: (url) => set({ accessServiceUrl: url.trim() }),
      setUserId: (id) => set({ userId: id }),
      setAuthState: (patch) => set((state) => ({ ...state, ...patch })),
      resetAuthState: () =>
        set({
          authSessionId: '',
          authUserCode: '',
          authVerificationUrl: '',
          authStatus: '',
          authCode: '',
          authExternalUserId: '',
          authDisplayName: '',
          authExpiresAt: '',
          isAuthPolling: false,
          currentHouseId: '',
          currentHouseName: '',
        }),
      setCurrentHouse: (id, name) =>
        set({ currentHouseId: id, currentHouseName: name.trim() || 'Home' }),
      clearCurrentHouse: () => set({ currentHouseId: '', currentHouseName: '' }),
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        set({ theme })
      },
      setLocale: (locale) => {
        document.documentElement.lang = locale === 'ru' ? 'ru' : 'en'
        set({ locale })
      },
    }),
    {
      name: 'local-frontend-settings',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const loc = state.locale === 'ru' || state.locale === 'en' ? state.locale : browserDefaultLocale()
        document.documentElement.lang = loc === 'ru' ? 'ru' : 'en'
        if (state.locale !== loc) {
          useSettingsStore.setState({ locale: loc })
        }
      },
    },
  ),
)

export function initTheme() {
  const stored = localStorage.getItem('local-frontend-settings')
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { state?: { theme?: string; locale?: string } }
      if (parsed?.state?.theme === 'dark') {
        document.documentElement.classList.add('dark')
      }
    } catch {
      // ignore
    }
  }
}

export function initLocale() {
  const stored = localStorage.getItem('local-frontend-settings')
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { state?: { locale?: string } }
      if (parsed?.state?.locale === 'ru' || parsed?.state?.locale === 'en') {
        document.documentElement.lang = parsed.state.locale === 'ru' ? 'ru' : 'en'
        return
      }
    } catch {
      // ignore
    }
  }
  document.documentElement.lang = browserDefaultLocale() === 'ru' ? 'ru' : 'en'
}
