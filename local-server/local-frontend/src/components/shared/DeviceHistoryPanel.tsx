import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Thermometer, Droplets, BatteryMedium, Wifi, Sun, Eye, Palette, ClipboardList } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { getZigbeeStates, getDeviceLogs } from '@/api/zigbee'
import type { ZigbeeDevice, ZigbeeState } from '@/types'

interface Props {
  devices: ZigbeeDevice[]
  mode: 'states' | 'logs'
}

function formatTs(ts: string) {
  try {
    return format(parseISO(ts), 'dd MMM HH:mm:ss')
  } catch {
    return ts
  }
}

/** Tooltip wrapper — shows label on hover via CSS only (no JS). */
function Tip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[11px] leading-none text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-slate-700">
        {label}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
      </span>
    </span>
  )
}

/** Inline chips showing all sensor readings for a single state row. */
function ReadingsCell({ s, labels }: { s: ZigbeeState; labels: Record<string, string> }) {
  const chips: React.ReactNode[] = []

  if (s.brightness != null)
    chips.push(
      <Tip key="br" label={labels.brightness}>
        <span className="flex items-center gap-0.5 whitespace-nowrap">
          <Sun className="h-3 w-3 text-yellow-400" />
          {Math.round((s.brightness / 254) * 100)}%
        </span>
      </Tip>,
    )

  if (s.temperature != null)
    chips.push(
      <Tip key="t" label={labels.temperature}>
        <span className="flex items-center gap-0.5 whitespace-nowrap">
          <Thermometer className="h-3 w-3 text-orange-400" />
          {s.temperature.toFixed(1)}°C
        </span>
      </Tip>,
    )

  if (s.humidity != null)
    chips.push(
      <Tip key="h" label={labels.humidity}>
        <span className="flex items-center gap-0.5 whitespace-nowrap">
          <Droplets className="h-3 w-3 text-blue-400" />
          {s.humidity.toFixed(0)}%
        </span>
      </Tip>,
    )

  if (s.occupancy != null)
    chips.push(
      <Tip key="occ" label={labels.occupancy}>
        <span
          className={`flex items-center gap-0.5 whitespace-nowrap font-medium ${s.occupancy ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}
        >
          <Eye className="h-3 w-3" />
          {s.occupancy ? '●' : '○'}
        </span>
      </Tip>,
    )

  if (s.colorMode != null)
    chips.push(
      <Tip key="cm" label={labels.colorMode}>
        <span className="flex items-center gap-0.5 whitespace-nowrap text-purple-500">
          <Palette className="h-3 w-3" />
          {s.colorMode}
        </span>
      </Tip>,
    )

  if (chips.length === 0) return <Dash />
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-700 dark:text-slate-300">
      {chips}
    </div>
  )
}

function hasAny(rows: ZigbeeState[], key: keyof ZigbeeState) {
  return rows.some((r) => r[key] !== undefined && r[key] !== null)
}

export function DeviceHistoryPanel({ devices, mode }: Props) {
  const { t } = useI18n()
  const [ieeeAddr, setIeeeAddr] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const readingLabels = {
    brightness: t('deviceDrawer.brightness'),
    temperature: t('deviceDrawer.temperature'),
    humidity: t('deviceDrawer.humidity'),
    occupancy: t('deviceDrawer.occupancy'),
    colorMode: t('deviceDrawer.colorMode'),
  }

  const statesQuery = useQuery({
    queryKey: ['zigbee-states', ieeeAddr, mode],
    queryFn: () => getZigbeeStates(ieeeAddr || undefined, 100),
    enabled: mode === 'states',
  })

  const logsQuery = useQuery({
    queryKey: ['zigbee-logs', ieeeAddr, from, to, mode],
    queryFn: () => getDeviceLogs(ieeeAddr || undefined, from || undefined, to || undefined),
    enabled: mode === 'logs',
  })

  const states = statesQuery.data ?? []
  const logs = logsQuery.data ?? []
  const isLoading = mode === 'states' ? statesQuery.isPending : logsQuery.isPending
  const isError = mode === 'states' ? statesQuery.isError : logsQuery.isError

  const showState = hasAny(states, 'state')
  const showBattery = hasAny(states, 'battery')
  const showLink = hasAny(states, 'linkquality')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('deviceHistory.device')}</label>
          <select
            value={ieeeAddr}
            onChange={(e) => setIeeeAddr(e.target.value)}
            className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">{t('deviceHistory.allDevices')}</option>
            {devices.map((d) => (
              <option key={d.ieeeAddr} value={d.ieeeAddr}>
                {d.friendlyName ?? d.ieeeAddr}
              </option>
            ))}
          </select>
        </div>

        {mode === 'logs' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('deviceHistory.from')}</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('deviceHistory.to')}</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </>
        )}
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {t('deviceHistory.loadFailed', { mode: mode === 'states' ? t('deviceHistory.modeStates') : t('deviceHistory.modeLogs') })}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : mode === 'states' ? (
        states.length === 0 ? (
          <Empty>{t('deviceHistory.emptyStates')}</Empty>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                <tr>
                  <Th>{t('deviceHistory.cols.timestamp')}</Th>
                  {showState && <Th>{t('deviceHistory.cols.state')}</Th>}
                  <Th>{t('deviceHistory.cols.readings')}</Th>
                  {showBattery && <Th>{t('deviceHistory.cols.battery')}</Th>}
                  {showLink && <Th>{t('deviceHistory.cols.link')}</Th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {states.map((s, i) => (
                  <tr
                    key={s.id ?? `${s.deviceIeeeAddr}-${s.timestamp}-${i}`}
                    className="bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {formatTs(s.timestamp)}
                    </td>
                    {showState && (
                      <td className="px-4 py-2.5">
                        {s.state ? (
                          <span className={
                            s.state === 'ON'
                              ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }>
                            {s.state}
                          </span>
                        ) : <Dash />}
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      <ReadingsCell s={s} labels={readingLabels} />
                    </td>
                    {showBattery && (
                      <td className="px-4 py-2.5">
                        {s.battery != null ? (
                          <span className="flex items-center gap-1 text-xs">
                            <BatteryMedium className="h-3 w-3 text-slate-400" />
                            {s.battery}%
                          </span>
                        ) : <Dash />}
                      </td>
                    )}
                    {showLink && (
                      <td className="px-4 py-2.5">
                        {s.linkquality != null ? (
                          <span className="flex items-center gap-1 text-xs">
                            <Wifi className="h-3 w-3 text-slate-400" />
                            {s.linkquality}
                          </span>
                        ) : <Dash />}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : logs.length === 0 ? (
        <Empty>{t('deviceHistory.emptyLogs')}</Empty>
      ) : (
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          {logs.map((entry, i) => (
            <div
              key={i}
              className="rounded-lg bg-slate-50 p-2.5 font-mono text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {typeof entry === 'string' ? entry : JSON.stringify(entry)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
      {children}
    </th>
  )
}

function Dash() {
  return <span className="text-slate-300 dark:text-slate-700">—</span>
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ClipboardList className="mb-3 h-10 w-10 text-slate-400 dark:text-slate-600" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>
    </div>
  )
}
