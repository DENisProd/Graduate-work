import { useMemo, useState, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  X, Power, Sun, Thermometer, Droplets, Eye, Palette,
  BatteryMedium, Wifi, ChevronDown, ChevronUp, Send, Activity,
  Cpu, Hash, Network, SlidersHorizontal,
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

type ExposeFeature = {
  property: string
  name?: string
  type?: string
  access?: number
  values?: string[]
  valueOn?: string
  valueOff?: string
  min?: number
  max?: number
  unit?: string
  description?: string
}

const DEFAULT_COMMAND_KEYS = new Set(['state', 'brightness', 'color_temp', 'color_temp_percent'])

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const arr = value.filter((item): item is string => typeof item === 'string')
  return arr.length > 0 ? arr : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function collectExposeFeatures(node: unknown, out: ExposeFeature[]) {
  if (Array.isArray(node)) {
    node.forEach((item) => collectExposeFeatures(item, out))
    return
  }

  const expose = asRecord(node)
  if (!expose) return

  const rawProperty = expose.property
  const rawName = expose.name
  const property =
    typeof rawProperty === 'string' && rawProperty.length > 0
      ? rawProperty
      : typeof rawName === 'string' && rawName.length > 0
        ? rawName
        : undefined

  if (property) {
    out.push({
      property,
      name: typeof rawName === 'string' ? rawName : undefined,
      type: typeof expose.type === 'string' ? expose.type : undefined,
      access: numberValue(expose.access),
      values: stringArray(expose.values),
      valueOn: typeof expose.value_on === 'string' ? expose.value_on : undefined,
      valueOff: typeof expose.value_off === 'string' ? expose.value_off : undefined,
      min: numberValue(expose.value_min),
      max: numberValue(expose.value_max),
      unit: typeof expose.unit === 'string' ? expose.unit : undefined,
      description: typeof expose.description === 'string' ? expose.description : undefined,
    })
  }

  for (const key of ['features', 'items', 'endpoints']) {
    collectExposeFeatures(expose[key], out)
  }
}

function isWritable(feature: ExposeFeature): boolean {
  if (typeof feature.access === 'number') return (feature.access & 2) === 2
  return DEFAULT_COMMAND_KEYS.has(feature.property)
}

function featureLabel(feature: ExposeFeature): string {
  return feature.name ?? feature.property
}

function getStateValue(state: PhysicalDeviceState | undefined, key: string): unknown {
  if (!state) return undefined
  const direct = (state as unknown as Record<string, unknown>)[key]
  if (direct !== undefined) return direct
  return state.payload?.[key]
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

type PhysicalDeviceState = NonNullable<ReturnType<typeof useDeviceStatesStore.getState>['states'] extends Map<string, infer T> ? T : never>

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: unknown
}) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900/70">
      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </span>
      <span className="break-all font-mono text-slate-800 dark:text-slate-200">
        {formatDetailValue(value)}
      </span>
    </div>
  )
}

export function DeviceControlDrawer({ device, open, onClose }: Props) {
  const { t } = useI18n()
  const state = useDeviceStatesStore((s) =>
    device ? s.states.get(device.protocolAddress) : undefined,
  )
  const setDeviceState = useDeviceStatesStore((s) => s.setDeviceState)
  const [rawJson, setRawJson] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const exposeFeatures = useMemo(() => {
    const out: ExposeFeature[] = []
    collectExposeFeatures(device?.definition?.exposes, out)
    return out
  }, [device?.definition])

  const capabilities = useMemo(() => {
    const keys = new Set<string>()
    for (const key of device?.capabilities ?? []) keys.add(key)
    for (const feature of exposeFeatures) keys.add(feature.property)
    for (const key of Object.keys(state?.payload ?? {})) keys.add(key)
    if (state) {
      for (const key of KNOWN_STATE_KEYS) {
        if (getStateValue(state, key) !== undefined) keys.add(key)
      }
    }
    return [...keys].sort((a, b) => a.localeCompare(b))
  }, [device?.capabilities, exposeFeatures, state])

  const stateFeature = exposeFeatures.find((f) => f.property === 'state' && isWritable(f))
  const brightnessFeature = exposeFeatures.find((f) => f.property === 'brightness' && isWritable(f))
  const colorTempFeature = exposeFeatures.find((f) => f.property === 'color_temp' && isWritable(f))
  const enumFeatures = exposeFeatures.filter(
    (f) => f.type === 'enum' && f.property !== 'state' && isWritable(f) && (f.values?.length ?? 0) > 0,
  )
  const hasPowerControl = Boolean(stateFeature) || hasCap(capabilities, 'state')
  const hasBrightnessControl = Boolean(brightnessFeature) || hasCap(capabilities, 'brightness')
  const hasColorTempControl = Boolean(colorTempFeature)

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
      timestamp: new Date().toISOString(),
      payload: {
        ...(state?.payload ?? {}),
        ...payload,
      },
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

  const brightnessRaw = getStateValue(state, 'brightness')
  const brightness = typeof brightnessRaw === 'number' ? brightnessRaw : 0
  const brightnessMax = brightnessFeature?.max ?? 254
  const brightnessPercent = Math.round((brightness / brightnessMax) * 100)
  const colorTempRaw = getStateValue(state, 'color_temp')
  const colorTemp = typeof colorTempRaw === 'number' ? colorTempRaw : (colorTempFeature?.min ?? 153)
  const colorTempMin = colorTempFeature?.min ?? 153
  const colorTempMax = colorTempFeature?.max ?? 500
  const hasPrimaryControls = hasPowerControl || hasBrightnessControl || hasColorTempControl || enumFeatures.length > 0

  // Universal sensor readings - show every defined field as a card
  type Reading = { key: string; label: string; value: string; icon: ReactNode; accent?: string }
  const readings: Reading[] = []

  const temperature = getStateValue(state, 'temperature')
  const humidity = getStateValue(state, 'humidity')
  const occupancy = getStateValue(state, 'occupancy')
  const colorMode = getStateValue(state, 'colorMode') ?? getStateValue(state, 'color_mode')
  const battery = getStateValue(state, 'battery')
  const linkquality = getStateValue(state, 'linkquality')

  if (typeof temperature === 'number') {
    readings.push({
      key: 'temp',
      label: t('deviceDrawer.temperature'),
      value: `${temperature.toFixed(1)}°C`,
      icon: <Thermometer className="h-3.5 w-3.5 text-orange-400" />,
    })
  }
  if (typeof humidity === 'number') {
    readings.push({
      key: 'hum',
      label: t('deviceDrawer.humidity'),
      value: `${humidity.toFixed(0)}%`,
      icon: <Droplets className="h-3.5 w-3.5 text-blue-400" />,
    })
  }
  if (typeof occupancy === 'boolean') {
    readings.push({
      key: 'occ',
      label: t('deviceDrawer.occupancy'),
      value: occupancy ? t('deviceDrawer.motionDetected') : t('deviceDrawer.motionClear'),
      icon: <Eye className={cn('h-3.5 w-3.5', occupancy ? 'text-amber-500' : 'text-slate-400')} />,
      accent: occupancy ? 'amber' : undefined,
    })
  }
  if (typeof colorMode === 'string') {
    readings.push({
      key: 'colorMode',
      label: t('deviceDrawer.colorMode'),
      value: colorMode,
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
          'fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-950 sm:w-96',
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
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {t('deviceDrawer.details')}
                  </p>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Zigbee
                  </span>
                </div>
                <div className="space-y-2">
                  <DetailRow icon={<Hash className="h-3.5 w-3.5" />} label={t('deviceDrawer.ieee')} value={device.protocolAddress} />
                  <DetailRow icon={<Network className="h-3.5 w-3.5" />} label={t('deviceDrawer.network')} value={device.networkAddress} />
                  <DetailRow icon={<Cpu className="h-3.5 w-3.5" />} label={t('deviceDrawer.type')} value={device.type} />
                  <DetailRow icon={<Cpu className="h-3.5 w-3.5" />} label={t('deviceDrawer.manufacturer')} value={device.manufacturerName} />
                  <DetailRow icon={<Cpu className="h-3.5 w-3.5" />} label={t('deviceDrawer.firmware')} value={device.firmwareVersion} />
                </div>
              </div>

              {capabilities.length > 0 && (
                <div className="space-y-2">
                  <p className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="h-3.5 w-3.5" /> {t('deviceDrawer.capabilities')}
                    </span>
                    <span>{capabilities.length}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {capabilities.map((capability) => (
                      <span
                        key={capability}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hasPowerControl && (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <Power className="h-3.5 w-3.5" /> {t('deviceDrawer.power')}
                  </p>
                  <div className="flex gap-2">
                    {([stateFeature?.valueOn ?? 'ON', stateFeature?.valueOff ?? 'OFF'] as const).map((val) => (
                      <button
                        key={val}
                        onClick={() => send({ state: val })}
                        disabled={mutation.isPending}
                        className={cn(
                          'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                          getStateValue(state, 'state') === val
                            ? val === 'ON'
                              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'border-slate-400 bg-slate-100 text-slate-600 dark:bg-slate-800'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                          mutation.isPending && 'opacity-60',
                        )}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasBrightnessControl && (
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
                    max={brightnessMax}
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
                        payload: {
                          ...(state?.payload ?? {}),
                          brightness: Number(e.target.value),
                        },
                      })
                    }
                    onPointerUp={(e) => send({ brightness: Number((e.target as HTMLInputElement).value) })}
                    className="w-full accent-blue-500"
                  />
                </div>
              )}

              {hasColorTempControl && (
                <div className="space-y-2">
                  <p className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
                    <span className="flex items-center gap-2">
                      <Palette className="h-3.5 w-3.5" /> {t('deviceDrawer.colorTemperature')}
                    </span>
                    <span>{colorTemp}{colorTempFeature?.unit ?? ''}</span>
                  </p>
                  <input
                    type="range"
                    min={colorTempMin}
                    max={colorTempMax}
                    value={colorTemp}
                    onChange={(e) =>
                      setDeviceState(device.protocolAddress, {
                        ...(state ?? {
                          id: '',
                          deviceIeeeAddr: device.protocolAddress,
                          timestamp: new Date().toISOString(),
                          payload: {},
                        }),
                        color_temp: Number(e.target.value),
                        payload: {
                          ...(state?.payload ?? {}),
                          color_temp: Number(e.target.value),
                        },
                      })
                    }
                    onPointerUp={(e) => send({ color_temp: Number((e.target as HTMLInputElement).value) })}
                    className="w-full accent-amber-500"
                  />
                </div>
              )}

              {enumFeatures.length > 0 && (
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <SlidersHorizontal className="h-3.5 w-3.5" /> {t('deviceDrawer.modes')}
                  </p>
                  {enumFeatures.map((feature) => (
                    <label key={feature.property} className="block space-y-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {featureLabel(feature)}
                      </span>
                      <select
                        value={String(getStateValue(state, feature.property) ?? '')}
                        onChange={(e) => send({ [feature.property]: e.target.value })}
                        disabled={mutation.isPending}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="">{t('deviceDrawer.selectMode')}</option>
                        {feature.values?.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}

              {!hasPrimaryControls && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200">
                  {t('deviceDrawer.noControls')}
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

              {typeof battery === 'number' && (
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <BatteryMedium className="h-3.5 w-3.5" /> {t('deviceDrawer.battery')}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          battery > 60
                            ? 'bg-emerald-500'
                            : battery > 20
                              ? 'bg-amber-500'
                              : 'bg-red-500',
                        )}
                        style={{ width: `${battery}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {battery}%
                    </span>
                  </div>
                </div>
              )}

              {typeof linkquality === 'number' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Wifi className="h-4 w-4" /> {t('deviceDrawer.linkQuality')}
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {linkquality} / 255
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
