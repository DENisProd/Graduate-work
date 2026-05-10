import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Cpu, Radio, Server, Thermometer, Droplets, BatteryMedium, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'
import { useZigbeeSocket } from '@/hooks/useZigbeeSocket'
import { useDeviceStatesStore } from '@/stores/device-states.store'
import type { PhysicalDevice } from '@/types'

const TYPE_ICONS = {
  Coordinator: Server,
  Router: Radio,
  EndDevice: Cpu,
}

function BatteryBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value))
  const color =
    pct > 60 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <BatteryMedium className="h-3.5 w-3.5" />
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span>{pct}%</span>
    </div>
  )
}

interface DeviceCardProps {
  device: PhysicalDevice
  onClick: () => void
}

export function DeviceCard({ device, onClick }: DeviceCardProps) {
  const { subscribe, unsubscribe } = useZigbeeSocket()
  const state = useDeviceStatesStore((s) => s.states.get(device.protocolAddress))
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    subscribe(device.protocolAddress)
    return () => { unsubscribe(device.protocolAddress) }
  }, [device.protocolAddress, subscribe, unsubscribe])

  useEffect(() => {
    if (!state) return
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 600)
    return () => clearTimeout(t)
  }, [state?.timestamp])

  const TypeIcon = TYPE_ICONS[device.type] ?? Cpu
  const displayName = device.friendlyName ?? device.name
  const stateVariant = state?.state === 'ON' ? 'on' : state?.state === 'OFF' ? 'off' : undefined

  const temp =
    state?.temperature !== undefined ? (state.temperature / 100).toFixed(1) : undefined
  const hum =
    state?.humidity !== undefined ? (state.humidity / 100).toFixed(0) : undefined

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex w-full flex-col gap-3 rounded-xl border bg-white p-4 text-left transition-all',
        'hover:border-blue-300 hover:shadow-md dark:bg-slate-950 dark:hover:border-blue-700',
        flash
          ? 'border-blue-400 ring-2 ring-blue-400/30 dark:border-blue-500'
          : 'border-slate-200 dark:border-slate-800',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <TypeIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {displayName}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {device.model ?? device.type}
            </p>
          </div>
        </div>
        {stateVariant && (
          <StatusBadge variant={stateVariant} pulse={stateVariant === 'on'} />
        )}
      </div>

      {(temp !== undefined || hum !== undefined || state?.battery !== undefined || state?.linkquality !== undefined) && (
        <div className="flex flex-wrap gap-3">
          {temp !== undefined && (
            <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
              <Thermometer className="h-3.5 w-3.5 text-orange-400" />
              {temp}°C
            </span>
          )}
          {hum !== undefined && (
            <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
              <Droplets className="h-3.5 w-3.5 text-blue-400" />
              {hum}%
            </span>
          )}
          {state?.linkquality !== undefined && (
            <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
              <Wifi className="h-3.5 w-3.5 text-slate-400" />
              {state.linkquality}
            </span>
          )}
          {state?.battery !== undefined && <BatteryBar value={state.battery} />}
        </div>
      )}

      {device.manufacturerName && (
        <p className="text-xs text-slate-400 dark:text-slate-600">{device.manufacturerName}</p>
      )}

      {device.lastSeen && (
        <p className="text-xs text-slate-400 dark:text-slate-600">
          {formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}
        </p>
      )}
    </button>
  )
}
