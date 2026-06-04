import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { listUserHouses } from '@/api/access'
import { getRuntimeSettings } from '@/api/system'
import { useSettingsStore } from '@/stores/settings.store'
import { useI18n } from '@/hooks/useI18n'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  const { t } = useI18n()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const setAuthState = useSettingsStore((s) => s.setAuthState)
  const setAccessServiceUrl = useSettingsStore((s) => s.setAccessServiceUrl)
  const setUserId = useSettingsStore((s) => s.setUserId)
  const setCurrentHouse = useSettingsStore((s) => s.setCurrentHouse)
  const currentHouseId = useSettingsStore((s) => s.currentHouseId)
  const currentHouseName = useSettingsStore((s) => s.currentHouseName)
  const authStatus = useSettingsStore((s) => s.authStatus)
  const authExternalUserId = useSettingsStore((s) => s.authExternalUserId)

  const { data: runtimeSettings } = useQuery({
    queryKey: ['runtime-settings-global'],
    queryFn: getRuntimeSettings,
    refetchInterval: 15_000,
  })

  useEffect(() => {
    if (!runtimeSettings) return
    setAuthState({
      authSessionId: runtimeSettings.authSessionId ?? '',
      authStatus: runtimeSettings.authStatus ?? '',
      authCode: runtimeSettings.authCode ?? '',
      authExternalUserId: runtimeSettings.authExternalUserId ?? '',
      authDisplayName: runtimeSettings.authDisplayName ?? '',
      authExpiresAt: runtimeSettings.authExpiresAt ?? '',
      isAuthPolling: runtimeSettings.authStatus === 'pending',
    })
    const ext = (runtimeSettings.authExternalUserId ?? '').trim()
    if (runtimeSettings.authStatus === 'authorized' && ext) {
      setUserId(ext)
    }
    if (runtimeSettings.accessServiceUrl?.trim()) {
      setAccessServiceUrl(runtimeSettings.accessServiceUrl.trim())
    }
  }, [runtimeSettings, setAuthState, setUserId, setAccessServiceUrl])

  const cloudUserId = authExternalUserId.trim()
  const { data: housesForCloudUser, isSuccess: housesLoaded } = useQuery({
    queryKey: ['houses-after-auth', cloudUserId],
    queryFn: () => listUserHouses(cloudUserId),
    enabled: authStatus === 'authorized' && cloudUserId.length > 0,
  })

  useEffect(() => {
    if (authStatus !== 'authorized' || !housesLoaded) return
    const houses = housesForCloudUser ?? []
    if (houses.length === 0) {
      useSettingsStore.getState().clearCurrentHouse()
      return
    }
    if (currentHouseId && houses.some((h) => h.id === currentHouseId)) {
      const h = houses.find((x) => x.id === currentHouseId)
      if (h && h.name !== currentHouseName) {
        setCurrentHouse(h.id, h.name)
      }
      return
    }
    const first = houses[0]
    setCurrentHouse(first.id, first.name)
  }, [
    authStatus,
    housesLoaded,
    housesForCloudUser,
    currentHouseId,
    currentHouseName,
    setCurrentHouse,
  ])

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        {authStatus === 'denied' && (
          <div className="flex shrink-0 items-center gap-2.5 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-medium">{t('authBanner.deniedTitle')}</span>
            <span className="mx-1 text-red-400">·</span>
            <span className="text-red-600 dark:text-red-400">{t('authBanner.deniedHint')}</span>
            <Link
              to="/settings"
              className="ml-auto shrink-0 rounded font-medium underline underline-offset-2 hover:no-underline"
            >
              {t('authBanner.goToSettings')}
            </Link>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
