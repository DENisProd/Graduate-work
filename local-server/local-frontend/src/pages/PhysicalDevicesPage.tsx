import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, ChevronLeft, ChevronRight, Wifi, WifiOff, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { listPhysicalDevices } from '@/api/physical-devices'
import { DeviceCard } from '@/components/shared/DeviceCard'
import { DeviceControlDrawer } from '@/components/shared/DeviceControlDrawer'
import { PairingDialog } from '@/components/shared/PairingDialog'
import { useZigbeeSocket } from '@/hooks/useZigbeeSocket'
import type { PhysicalDevice } from '@/types'

function Skeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex gap-3">
        <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
      <div className="mt-3 h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  )
}

const PAGE_SIZE = 12

export function PhysicalDevicesPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(0)
  const [houseId, setHouseId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [selected, setSelected] = useState<PhysicalDevice | null>(null)
  const [pairingOpen, setPairingOpen] = useState(false)
  const { connected } = useZigbeeSocket()

  const filters = {
    page,
    size: PAGE_SIZE,
    ...(houseId ? { houseId } : {}),
    ...(roomId ? { roomId } : {}),
  }

  const { data, isPending, isError } = useQuery({
    queryKey: ['physical-devices', filters],
    queryFn: () => listPhysicalDevices(filters),
    placeholderData: (prev) => prev,
  })

  const devices = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('physicalDevices.title')}
          </h1>
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
              connected
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
            )}
          >
            {connected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {connected ? t('physicalDevices.live') : t('physicalDevices.offline')}
          </span>
        </div>
        <button
          onClick={() => setPairingOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          {t('physicalDevices.addDevice')}
        </button>
      </div>

      <div className="flex gap-3">
        <input
          value={houseId}
          onChange={(e) => { setHouseId(e.target.value); setPage(0) }}
          placeholder={t('physicalDevices.filterHouse')}
          className="w-48 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <input
          value={roomId}
          onChange={(e) => { setRoomId(e.target.value); setPage(0) }}
          placeholder={t('physicalDevices.filterRoom')}
          className="w-48 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {t('physicalDevices.loadError')}
        </div>
      )}

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Radio className="mb-3 h-10 w-10 text-slate-400 dark:text-slate-600" />
          <p className="font-medium text-slate-700 dark:text-slate-300">{t('physicalDevices.emptyTitle')}</p>
          <p className="mt-1 text-sm text-slate-400">
            {houseId || roomId ? t('physicalDevices.emptyFiltered') : t('physicalDevices.emptyHint')}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t(
              totalElements === 1 ? 'physicalDevices.deviceOne' : 'physicalDevices.deviceMany',
              { count: totalElements },
            )}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onClick={() => setSelected(device)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-slate-500">
                {t('common.pageOf', { current: page + 1, total: totalPages })}
              </span>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      <DeviceControlDrawer
        device={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
      <PairingDialog open={pairingOpen} onClose={() => setPairingOpen(false)} />
    </div>
  )
}
