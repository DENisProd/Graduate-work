import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow, parseISO } from 'date-fns'
import type { Locale } from 'date-fns/locale'
import {
  RefreshCw, Trash2, ExternalLink,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Wifi, WifiOff, Radio, Plus, CheckCircle2, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { listZigbeeDevices, syncFromBridge, deleteZigbeeDevice } from '@/api/zigbee'
import { listModbusDevices, deleteModbusDevice } from '@/api/modbus'
import { DeviceControlDrawer } from '@/components/shared/DeviceControlDrawer'
import { ModbusDeviceDrawer } from '@/components/shared/ModbusDeviceDrawer'
import { DeviceHistoryPanel } from '@/components/shared/DeviceHistoryPanel'
import { ModbusTab, AddDeviceModal } from '@/pages/ModbusPage'
import { useZigbeeSocket } from '@/hooks/useZigbeeSocket'
import { useDeviceStatesStore } from '@/stores/device-states.store'
import type { ZigbeeDevice, ModbusDevice, PhysicalDevice } from '@/types'

type Tab = 'devices' | 'states' | 'logs' | 'modbus'
type SortDir = 'asc' | 'desc'
type UnifiedDevice =
  | { protocol: 'zigbee'; d: ZigbeeDevice }
  | { protocol: 'modbus'; d: ModbusDevice }

const PAGE_SIZE = 20

function formatLastSeen(date: string | undefined, locale: Locale) {
  if (!date) return '—'
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true, locale })
  } catch {
    return date
  }
}

function SignalBars({ quality }: { quality?: number }) {
  if (quality === undefined) return <span className="text-xs text-slate-400">—</span>
  const level = quality > 192 ? 4 : quality > 128 ? 3 : quality > 64 ? 2 : quality > 0 ? 1 : 0
  return (
    <div className="flex items-end gap-0.5" title={`${quality}/255`}>
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={cn(
            'w-1.5 rounded-sm transition-colors',
            bar <= level
              ? level >= 3 ? 'bg-emerald-500' : level === 2 ? 'bg-amber-500' : 'bg-red-500'
              : 'bg-slate-200 dark:bg-slate-700',
          )}
          style={{ height: `${bar * 4 + 2}px` }}
        />
      ))}
    </div>
  )
}

function toPhysicalDevice(d: ZigbeeDevice): PhysicalDevice {
  return {
    id: d.id,
    name: d.friendlyName ?? d.ieeeAddr,
    protocolAddress: d.ieeeAddr,
    networkAddress: d.networkAddr,
    type: d.type,
    manufacturerName: d.manufacturerName,
    model: d.model,
    friendlyName: d.friendlyName,
    firmwareVersion: d.firmwareVersion,
    capabilities: [],
  }
}

function ZigbeeDeleteDialog({
  device,
  onConfirm,
  onCancel,
  t,
}: {
  device: ZigbeeDevice
  onConfirm: () => void
  onCancel: () => void
  t: (key: string, vars?: Record<string, string | number | undefined>) => string
}) {
  const name = device.friendlyName ?? device.ieeeAddr
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('zigbee.deleteTitle')}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t('zigbee.deleteBody', { name })}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </>
  )
}

function ModbusDeleteDialog({
  device,
  onConfirm,
  onCancel,
  t,
}: {
  device: ModbusDevice
  onConfirm: () => void
  onCancel: () => void
  t: (key: string, vars?: Record<string, string | number | undefined>) => string
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('modbus.deleteDeviceTitle')}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t('modbus.deleteDeviceBody', { name: device.name })}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </>
  )
}

function ZigbeeBadge() {
  return (
    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
      Zigbee
    </span>
  )
}

function ModbusBadge() {
  return (
    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
      Modbus
    </span>
  )
}

export function ZigbeePage() {
  const { t, dateLocale } = useI18n()
  const [tab, setTab] = useState<Tab>('devices')
  const [page, setPage] = useState(0)
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Zigbee device detail
  const [controlDevice, setControlDevice] = useState<PhysicalDevice | null>(null)
  const [pendingDeleteZigbee, setPendingDeleteZigbee] = useState<ZigbeeDevice | null>(null)

  // Modbus device detail
  const [selectedModbus, setSelectedModbus] = useState<ModbusDevice | null>(null)
  const [pendingDeleteModbus, setPendingDeleteModbus] = useState<ModbusDevice | null>(null)
  const [showAddModbus, setShowAddModbus] = useState(false)

  const { connected } = useZigbeeSocket()
  const states = useDeviceStatesStore((s) => s.states)
  const queryClient = useQueryClient()

  const { data: zigbeeDevices = [], isPending: zigbeePending, isError: zigbeeError } = useQuery({
    queryKey: ['zigbee-devices'],
    queryFn: listZigbeeDevices,
  })

  const { data: modbusDevices = [], isPending: modbusPending, isError: modbusError } = useQuery({
    queryKey: ['modbus-devices'],
    queryFn: listModbusDevices,
  })

  const syncMutation = useMutation({
    mutationFn: syncFromBridge,
    onSuccess: (result) => {
      if (result.count != null) {
        toast.success(t('zigbee.toastSyncedCount', { count: result.count }))
      } else {
        toast.success(t('zigbee.toastSyncedAll'))
      }
      queryClient.invalidateQueries({ queryKey: ['zigbee-devices'] })
    },
    onError: () => toast.error(t('zigbee.toastSyncFailed')),
  })

  const zigbeeDeleteMutation = useMutation({
    mutationFn: deleteZigbeeDevice,
    onSuccess: () => {
      toast.success(t('zigbee.toastRemoved'))
      setPendingDeleteZigbee(null)
      queryClient.invalidateQueries({ queryKey: ['zigbee-devices'] })
    },
    onError: () => toast.error(t('zigbee.toastDeleteFailed')),
  })

  const modbusDeleteMutation = useMutation({
    mutationFn: (device: ModbusDevice) => deleteModbusDevice(device.id),
    onSuccess: (_, deleted) => {
      toast.success(t('modbus.toastDeviceDeleted'))
      setPendingDeleteModbus(null)
      if (selectedModbus?.id === deleted.id) setSelectedModbus(null)
      queryClient.invalidateQueries({ queryKey: ['modbus-devices'] })
    },
    onError: () => toast.error(t('modbus.toastDeviceDeleteFailed')),
  })

  const sortedZigbee = useMemo(() => {
    return [...zigbeeDevices].sort((a, b) => {
      const ta = a.lastSeen ? new Date(a.lastSeen).getTime() : 0
      const tb = b.lastSeen ? new Date(b.lastSeen).getTime() : 0
      return sortDir === 'desc' ? tb - ta : ta - tb
    })
  }, [zigbeeDevices, sortDir])

  const combined: UnifiedDevice[] = useMemo(() => {
    const z = sortedZigbee.map((d): UnifiedDevice => ({ protocol: 'zigbee', d }))
    const m = [...modbusDevices]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((d): UnifiedDevice => ({ protocol: 'modbus', d }))
    return [...z, ...m]
  }, [sortedZigbee, modbusDevices])

  const totalPages = Math.ceil(combined.length / PAGE_SIZE)
  const paginated = combined.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const TABS: { key: Tab; labelKey: 'zigbee.tabDevices' | 'zigbee.tabStates' | 'zigbee.tabLogs' | 'zigbee.tabModbus' }[] = [
    { key: 'devices', labelKey: 'zigbee.tabDevices' },
    { key: 'states', labelKey: 'zigbee.tabStates' },
    { key: 'logs', labelKey: 'zigbee.tabLogs' },
    { key: 'modbus', labelKey: 'zigbee.tabModbus' },
  ]

  const isPending = zigbeePending || modbusPending
  const isError = zigbeeError || modbusError

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('zigbee.title')}
          </h1>
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
              connected
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
            )}
          >
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? t('physicalDevices.live') : t('physicalDevices.offline')}
          </span>
        </div>

        {tab === 'devices' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModbus(true)}
              className="flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30"
            >
              <Plus className="h-4 w-4" />
              {t('modbus.addDevice')}
            </button>
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <RefreshCw className={cn('h-4 w-4', syncMutation.isPending && 'animate-spin')} />
              {t('zigbee.syncFromBridge')}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setPage(0) }}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === key
                ? 'border-b-2 border-blue-600 text-blue-700 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            {t(labelKey)}
            {key === 'devices' && combined.length > 0 && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {combined.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Devices tab — unified list */}
      {tab === 'devices' && (
        <>
          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {t('zigbee.loadError')}
            </div>
          )}

          {isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          ) : combined.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Radio className="mb-3 h-10 w-10 text-slate-400 dark:text-slate-600" />
              <p className="font-medium text-slate-700 dark:text-slate-300">{t('zigbee.emptyTitle')}</p>
              <p className="mt-1 text-sm text-slate-400">{t('zigbee.emptyHint')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t('zigbee.colNameModel')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t('devices.colProtocol')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t('devices.colAddress')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t('devices.colStatus')}
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                      >
                        <span className="flex items-center gap-1">
                          {t('zigbee.colLastSeen')}
                          {sortDir === 'desc' ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronUp className="h-3 w-3" />
                          )}
                        </span>
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginated.map((item) => {
                      if (item.protocol === 'zigbee') {
                        const device = item.d
                        const liveState = states.get(device.ieeeAddr)
                        return (
                          <tr
                            key={`z-${device.id}`}
                            className="bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {device.friendlyName ?? '—'}
                              </div>
                              {device.model && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {device.model}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <ZigbeeBadge />
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                              {device.ieeeAddr}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <SignalBars quality={liveState?.linkquality} />
                                {device.interviewCompleted ? (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    {t('zigbee.interviewDone')}
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    {t('zigbee.interviewPending')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                              {formatLastSeen(device.lastSeen, dateLocale)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setControlDevice(toPhysicalDevice(device))}
                                  title={t('zigbee.openControl')}
                                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setPendingDeleteZigbee(device)}
                                  title={t('zigbee.deleteDevice')}
                                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      }

                      // Modbus device row
                      const device = item.d
                      return (
                        <tr
                          key={`m-${device.id}`}
                          className="bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {device.name}
                            </div>
                            {device.description && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {device.description}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <ModbusBadge />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                            slave {device.slaveId}
                          </td>
                          <td className="px-4 py-3">
                            {device.enabled ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t('modbus.formEnabled')}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <XCircle className="h-3.5 w-3.5" />
                                {t('devices.disabled')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">—</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedModbus(device)}
                                title={t('zigbee.openControl')}
                                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setPendingDeleteModbus(device)}
                                title={t('common.delete')}
                                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
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
        </>
      )}

      {(tab === 'states' || tab === 'logs') && (
        <DeviceHistoryPanel devices={zigbeeDevices} mode={tab} />
      )}

      {tab === 'modbus' && <ModbusTab />}

      {/* Zigbee device detail drawer */}
      <DeviceControlDrawer
        device={controlDevice}
        open={controlDevice !== null}
        onClose={() => setControlDevice(null)}
      />

      {/* Modbus device detail drawer */}
      <ModbusDeviceDrawer
        device={selectedModbus}
        open={selectedModbus !== null}
        onClose={() => setSelectedModbus(null)}
      />

      {/* Add Modbus Device modal */}
      {showAddModbus && (
        <AddDeviceModal
          onClose={() => setShowAddModbus(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['modbus-devices'] })}
          t={t}
        />
      )}

      {pendingDeleteZigbee && (
        <ZigbeeDeleteDialog
          device={pendingDeleteZigbee}
          onConfirm={() => zigbeeDeleteMutation.mutate(pendingDeleteZigbee.ieeeAddr)}
          onCancel={() => setPendingDeleteZigbee(null)}
          t={t}
        />
      )}

      {pendingDeleteModbus && (
        <ModbusDeleteDialog
          device={pendingDeleteModbus}
          onConfirm={() => modbusDeleteMutation.mutate(pendingDeleteModbus)}
          onCancel={() => setPendingDeleteModbus(null)}
          t={t}
        />
      )}
    </div>
  )
}
