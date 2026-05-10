import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, Power, Sun, Thermometer, Droplets, BatteryMedium, Wifi, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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

export function DeviceControlDrawer({ device, open, onClose }: Props) {
  const state = useDeviceStatesStore((s) =>
    device ? s.states.get(device.protocolAddress) : undefined,
  )
  const setDeviceState = useDeviceStatesStore((s) => s.setDeviceState)
  const [rawJson, setRawJson] = useState('')
  const [showRaw, setShowRaw] = useState(false)

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      sendCommand(device!.protocolAddress, payload),
    onError: () => toast.error('Command failed'),
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
      toast.error('Invalid JSON')
    }
  }

  const brightness = state?.brightness ?? 0
  const brightnessPercent = Math.round((brightness / 254) * 100)
  const temp = state?.temperature !== undefined ? (state.temperature / 100).toFixed(1) : null
  const hum = state?.humidity !== undefined ? (state.humidity / 100).toFixed(0) : null

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
                    <Power className="h-3.5 w-3.5" /> Power
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
                      <Sun className="h-3.5 w-3.5" /> Brightness
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

              {(temp !== null || hum !== null) && (
                <div className="grid grid-cols-2 gap-3">
                  {temp !== null && (
                    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <Thermometer className="h-3.5 w-3.5 text-orange-400" /> Temperature
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-200">
                        {temp}°C
                      </p>
                    </div>
                  )}
                  {hum !== null && (
                    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <Droplets className="h-3.5 w-3.5 text-blue-400" /> Humidity
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-200">
                        {hum}%
                      </p>
                    </div>
                  )}
                </div>
              )}

              {state?.battery !== undefined && (
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <BatteryMedium className="h-3.5 w-3.5" /> Battery
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
                    <Wifi className="h-4 w-4" /> Link quality
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
                  <span>Custom Command</span>
                  {showRaw ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showRaw && (
                  <div className="mt-3 space-y-2">
                    {state && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-slate-500">Last payload</summary>
                        <pre className="mt-1 overflow-auto rounded bg-slate-100 p-2 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          {JSON.stringify(state.payload, null, 2)}
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
                      <Send className="h-4 w-4" /> Send
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
