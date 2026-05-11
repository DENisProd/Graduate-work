import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listUserHouses } from '@/api/access'
import { getRuntimeSettings } from '@/api/system'
import { useSettingsStore } from '@/stores/settings.store'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
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
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
