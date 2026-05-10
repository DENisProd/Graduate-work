import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Thermometer, Droplets, BatteryMedium, Wifi } from 'lucide-react'
import { getZigbeeStates, getDeviceLogs } from '@/api/zigbee'
import type { ZigbeeDevice } from '@/types'

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

export function DeviceHistoryPanel({ devices, mode }: Props) {
  const [ieeeAddr, setIeeeAddr] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Device</label>
          <select
            value={ieeeAddr}
            onChange={(e) => setIeeeAddr(e.target.value)}
            className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">All devices</option>
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
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">To</label>
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
          Failed to load {mode === 'states' ? 'states' : 'logs'}.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : mode === 'states' ? (
        states.length === 0 ? (
          <Empty>No state records found</Empty>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                <tr>
                  {['Timestamp', 'State', 'Temp', 'Humidity', 'Battery', 'Link Quality'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {states.map((s) => (
                  <tr
                    key={s.id}
                    className="bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {formatTs(s.timestamp)}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.state ? (
                        <span
                          className={
                            s.state === 'ON'
                              ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }
                        >
                          {s.state}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.temperature !== undefined ? (
                        <span className="flex items-center gap-1 text-xs">
                          <Thermometer className="h-3 w-3 text-orange-400" />
                          {(s.temperature / 100).toFixed(1)}°C
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.humidity !== undefined ? (
                        <span className="flex items-center gap-1 text-xs">
                          <Droplets className="h-3 w-3 text-blue-400" />
                          {(s.humidity / 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.battery !== undefined ? (
                        <span className="flex items-center gap-1 text-xs">
                          <BatteryMedium className="h-3 w-3 text-slate-400" />
                          {s.battery}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.linkquality !== undefined ? (
                        <span className="flex items-center gap-1 text-xs">
                          <Wifi className="h-3 w-3 text-slate-400" />
                          {s.linkquality}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : logs.length === 0 ? (
        <Empty>No log entries found</Empty>
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 text-4xl">📋</div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>
    </div>
  )
}
