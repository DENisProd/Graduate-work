import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  X, Power, Sun, Thermometer, Droplets, Eye, Palette,
  BatteryMedium, Wifi, ChevronDown, ChevronUp, Send, Activity,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { useDeviceStatesStore } from '@/stores/device-states.store'
import { sendCommand } from '@/api/zigbee'
import type { PhysicalDevice } from '@/types'

function hasCap(caps: string[], ...keys: string[]) {
  return keys.some((k) => caps.some((c) => c.toLowerCase().includes(k.toLowerCase())))
}

interface Props {
  device: PhysicalDevice | null
  open: boolean
  onClose: () => void
}

const KNOWN_STATE_KEYS = new Set([
  'state', 'brightness', 'temperature', 'humidity', 'occupancy',
  'battery', 'linkquality', 'colorMode', 'deviceIeeeAddr', 'timestamp', 'id', 'payload',
])

export function DeviceControlDrawer({ device, open, onClose }: Props) {
  const { t } = useI18n()
  const state = useDeviceStatesStore((s) =>
    device ? s.states.get(device.protocolAddress) : undefined,
  )
  const setDeviceState = useDeviceStatesStore((s) => s.setDeviceState)
  const [rawJson, setRawJson] = useState('')
  const [showRaw, setShowRaw] = useState(false)

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      sendCommand(device!.protocolAddress, payload),
    onError: () => toast.error(t('deviceDrawer.toastCommandFailed')),
  })

  const send = (payload: Record<string, unknown>) => {
    if (!device) return
    setDeviceState(device.protocolAddress, {
      ...(state ?? {
        id: '',
        deviceIeeeAddr: device.protocolAddress,
        timestamp: new Date().toISOString(),
        payload: {},
      }),
      ...payload,
    })
    mutation.mutate(payload)
  }

  const handleSendRaw = () => {
    try {
      const parsed = JSON.parse(rawJson) as Record<string, unknown>
      send(parsed)
      setRawJson('')
    } catch {
      toast.error(t('deviceDrawer.toastInvalidJson'))
    }
  }

  const brightness = state?.brightness ?? 0
  const brightnessPercent = Math.round((brightness / 254) * 100)

  // Universal sensor readings - show every defined field as a card
  type Reading = { key: string; label: string; value: string; icon: React.ReactNode; accent?: string }
  const readings: Reading[] = []

  if (state?.temperature !== undefined) {
    readings.push({
      key: 'temp',
      label: t('deviceDrawer.temperature'),
      value: `${state.temperature.toFixed(1)}°C`,
      icon: <Thermometer className="h-3.5 w-3.5 text-orange-400" />,
    })
  }
  if (state?.humidity !== undefined) {
    readings.push({
      key: 'hum',
      label: t('deviceDrawer.humidity'),
      value: `${state.humidity.toFixed(0)}%`,
      icon: <Droplets className="h-3.5 w-3.5 text-blue-400" />,
    })
  }
  if (state?.occupancy !== undefined) {
    readings.push({
      key: 'occ',
      label: t('deviceDrawer.occupancy'),
      value: state.occupancy ? t('deviceDrawer.motionDetected') : t('deviceDrawer.motionClear'),
      icon: <Eye className={cn('h-3.5 w-3.5', state.occupancy ? 'text-amber-500' : 'text-slate-400')} />,
      accent: state.occupancy ? 'amber' : undefined,
    })
  }
  if (state?.colorMode !== undefined) {
    readings.push({
      key: 'colorMode',
      label: t('deviceDrawer.colorMode'),
      value: state.colorMode,
      icon: <Palette className="h-3.5 w-3.5 text-purple-400" />,
    })
  }
  // Any extra fields from the raw payload not already shown
  for (const [k, v] of Object.entries(state?.payload ?? {})) {
    if (!KNOWN_STATE_KEYS.has(k) && v !== null && v !== undefined) {
      readings.push({
        key: k,
        label: k,
        value: typeof v === 'object' ? JSON.stringify(v) : String(v),
        icon: <Activity className="h-3.5 w-3.5 text-slate-400" />,
      })
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-96 flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-950',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {device && (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                  {device.friendlyName ?? device.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {device.model} · {device.protocolAddress}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {hasCap(device.capabilities, 'state') && (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <Power className="h-3.5 w-3.5" /> {t('deviceDrawer.power')}
                  </p>
                  <div className="flex gap-2">
                    {(['ON', 'OFF'] as const).map((val) => (
                      <button
                        key={val}
                        onClick={() => send({ state: val })}
                        className={cn(
                          'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                          state?.state === val
                            ? val === 'ON'
                              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'border-slate-400 bg-slate-100 text-slate-600 dark:bg-slate-800'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                        )}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasCap(device.capabilities, 'brightness') && (
                <div className="space-y-2">
                  <p className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
                    <span className="flex items-center gap-2">
                      <Sun className="h-3.5 w-3.5" /> {t('deviceDrawer.brightness')}
                    </span>
                    <span>{brightnessPercent}%</span>
                  </p>
                  <input
                    type="range"
                    min={0}
                    max={254}
                    value={brightness}
                    onChange={(e) =>
                      setDeviceState(device.protocolAddress, {
                        ...(state ?? {
                          id: '',
                          deviceIeeeAddr: device.protocolAddress,
                          timestamp: new Date().toISOString(),
                          payload: {},
                        }),
                        brightness: Number(e.target.value),
                      })
                    }
                    onPointerUp={(e) => send({ brightness: Number((e.target as HTMLInputElement).value) })}
                    className="w-full accent-blue-500"
                  />
                </div>
              )}

              {readings.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {readings.map((r) => (
                    <div
                      key={r.key}
                      className={cn(
                        'rounded-lg border p-3',
                        r.accent === 'amber'
                          ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                          : 'border-slate-200 dark:border-slate-800',
                      )}
                    >
                      <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        {r.icon} {r.label}
                      </p>
                      <p className="mt-1 text-xl font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {r.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {state?.battery !== undefined && (
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <BatteryMedium className="h-3.5 w-3.5" /> {t('deviceDrawer.battery')}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          state.battery > 60
                            ? 'bg-emerald-500'
                            : state.battery > 20
                              ? 'bg-amber-500'
                              : 'bg-red-500',
                        )}
                        style={{ width: `${state.battery}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {state.battery}%
                    </span>
                  </div>
                </div>
              )}

              {state?.linkquality !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Wifi className="h-4 w-4" /> {t('deviceDrawer.linkQuality')}
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {state.linkquality} / 255
                  </span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  onClick={() => setShowRaw((v) => !v)}
                  className="flex w-full items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <span>{t('deviceDrawer.customCommand')}</span>
                  {showRaw ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showRaw && (
                  <div className="mt-3 space-y-2">
                    {state && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-slate-500">{t('scenarioDef.lastPayload')}</summary>
                        <pre className="mt-1 overflow-auto rounded bg-slate-100 p-2 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          {JSON.stringify(state, null, 2)}
                        </pre>
                      </details>
                    )}
                    <textarea
                      value={rawJson}
                      onChange={(e) => setRawJson(e.target.value)}
                      placeholder={'{ "state": "ON" }'}
                      rows={4}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <button
                      onClick={handleSendRaw}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" /> {t('common.send')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
