import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Zap, ToggleRight, MousePointerClick,
  Wifi, WifiOff, Activity, Lightbulb, Fan, Lock,
  Camera, Loader2, AlertCircle, Thermometer, RefreshCw,
} from 'lucide-react'
import { readModbusRegister, writeModbusRegister } from '@/api/modbus'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getPhysicalDevice } from '@/api/physical-devices'
import { getZigbeeStates, sendCommand } from '@/api/zigbee'
import { triggerScenario } from '@/api/scenarios'
import type { LocalWidgetDashboard, WidgetInstance, WidgetLayout } from '@/api/widget-dashboards'

const ROW_H = 64 // px per RGL row unit (gap is 12px per gutter)

// ── Telemetry hook ────────────────────────────────────────────────────────────

function useDeviceState(physicalDeviceId: string | undefined) {
  const devQ = useQuery({
    queryKey: ['widget-pd', physicalDeviceId],
    queryFn: () => getPhysicalDevice(physicalDeviceId!),
    enabled: !!physicalDeviceId,
    staleTime: 60_000,
  })
  const ieeeAddr = devQ.data?.protocolAddress
  const stateQ = useQuery({
    queryKey: ['widget-zstate', ieeeAddr],
    queryFn: () => getZigbeeStates(ieeeAddr!, 1),
    enabled: !!ieeeAddr,
    refetchInterval: 15_000,
    staleTime: 10_000,
  })
  return { device: devQ.data ?? null, state: stateQ.data?.[0] ?? null }
}

function readPayload(
  state: ReturnType<typeof useDeviceState>['state'],
  key: string,
): unknown {
  if (!state) return null
  if (key in state) return (state as unknown as Record<string, unknown>)[key]
  return state.payload?.[key] ?? null
}

// ── Widget shell ──────────────────────────────────────────────────────────────

function Shell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'h-full overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ── TEXT_LABEL ────────────────────────────────────────────────────────────────

function TextLabelWidget({ config }: { config: Record<string, unknown> }) {
  const text = String(config.text ?? '')
  const align = String(config.align ?? 'left')
  const fontSize = String(config.fontSize ?? 'md')
  const style = String(config.style ?? 'body')

  const sizeClass =
    ({ sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl' } as Record<string, string>)[
      fontSize
    ] ?? 'text-base'
  const weightClass =
    style === 'title' ? 'font-bold' : style === 'subtitle' ? 'font-semibold' : 'font-normal'
  const colorClass =
    style === 'title'
      ? 'text-slate-900 dark:text-slate-100'
      : style === 'divider'
        ? 'text-slate-400'
        : 'text-slate-700 dark:text-slate-300'
  const alignClass =
    align === 'center' ? 'justify-center text-center' : align === 'right' ? 'justify-end text-right' : ''

  if (style === 'divider') {
    return (
      <div className="flex h-full items-center gap-3 px-3">
        <span className={cn('shrink-0', sizeClass, colorClass)}>{text}</span>
        <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
      </div>
    )
  }

  return (
    <div className={cn('flex h-full items-center px-4', alignClass)}>
      <span className={cn(sizeClass, weightClass, colorClass, 'leading-snug')}>{text}</span>
    </div>
  )
}

// ── TELEMETRY_VALUE ───────────────────────────────────────────────────────────

function TelemetryValueWidget({ config }: { config: Record<string, unknown> }) {
  const physicalDeviceId = config.physicalDeviceId as string | undefined
  const payloadKey = String(config.payloadKey ?? 'value')
  const label = config.label as string | undefined
  const unit = config.unit as string | undefined
  const displayVariant = String(config.displayVariant ?? 'numeric')

  const { state } = useDeviceState(physicalDeviceId || undefined)
  const rawValue = readPayload(state, payloadKey)
  const formatted =
    rawValue == null ? '—' : typeof rawValue === 'number' ? rawValue.toFixed(1) : String(rawValue)
  const isOn =
    typeof rawValue === 'string' && ['on', 'true', 'open', 'active'].includes(rawValue.toLowerCase())

  return (
    <Shell>
      <div className="flex h-full flex-col items-center justify-center gap-1 px-3 py-3">
        {label && (
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        )}
        {displayVariant === 'badge' ? (
          <span
            className={cn(
              'rounded-full px-3 py-1 text-sm font-semibold',
              isOn
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
            )}
          >
            {formatted.toUpperCase()}
          </span>
        ) : displayVariant === 'boolean' ? (
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full text-2xl',
              isOn ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500',
            )}
          >
            {isOn ? '●' : '○'}
          </div>
        ) : (
          <div className="flex items-end gap-1">
            <span className="text-4xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {formatted}
            </span>
            {unit && <span className="mb-1 text-lg text-slate-400">{unit}</span>}
          </div>
        )}
      </div>
    </Shell>
  )
}

// ── DEVICE_STATUS ─────────────────────────────────────────────────────────────

function DeviceStatusWidget({ config }: { config: Record<string, unknown> }) {
  const physicalDeviceId = config.physicalDeviceId as string | undefined
  const label = config.label as string | undefined
  const showLastSeen = config.showLastSeen !== false

  const { device } = useDeviceState(physicalDeviceId || undefined)
  const isOnline =
    device?.lastSeen != null &&
    Date.now() - new Date(device.lastSeen).getTime() < 5 * 60 * 1000

  return (
    <Shell>
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4">
        {isOnline ? (
          <Wifi className="h-8 w-8 text-emerald-500" />
        ) : (
          <WifiOff className="h-8 w-8 text-slate-300 dark:text-slate-600" />
        )}
        <p className="truncate text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
          {label || device?.friendlyName || device?.name || '—'}
        </p>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-semibold',
            isOnline
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
          )}
        >
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
        {showLastSeen && device?.lastSeen && (
          <p className="text-xs text-slate-400">
            {new Date(device.lastSeen).toLocaleTimeString()}
          </p>
        )}
      </div>
    </Shell>
  )
}

// ── CONTROL_BUTTON ────────────────────────────────────────────────────────────

function ControlButtonWidget({ config }: { config: Record<string, unknown> }) {
  const physicalDeviceId = config.physicalDeviceId as string | undefined
  const configIeeeAddr = config.ieeeAddr as string | undefined
  const label = String(config.label ?? 'Execute')
  const commandPayload = (config.commandPayload ?? {}) as Record<string, unknown>
  const buttonStyle = String(config.buttonStyle ?? 'primary')
  const confirmRequired = config.confirmRequired === true

  const { device } = useDeviceState(physicalDeviceId || undefined)
  const ieeeAddr = configIeeeAddr || device?.protocolAddress
  const [confirming, setConfirming] = useState(false)

  const mutation = useMutation({
    mutationFn: () => sendCommand(ieeeAddr!, commandPayload),
    onSuccess: () => { toast.success(`${label}: OK`); setConfirming(false) },
    onError: () => { toast.error('Command failed'); setConfirming(false) },
  })

  const colorClass =
    buttonStyle === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : buttonStyle === 'ghost'
        ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
        : 'bg-blue-600 hover:bg-blue-700 text-white'

  return (
    <Shell>
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4">
        <MousePointerClick className="h-6 w-6 text-slate-400" />
        {confirming ? (
          <div className="flex gap-2">
            <button
              onClick={() => mutation.mutate()}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (!ieeeAddr) return toast.error('No device address')
              if (confirmRequired && !confirming) return setConfirming(true)
              mutation.mutate()
            }}
            disabled={mutation.isPending || !ieeeAddr}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
              colorClass,
            )}
          >
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {label}
          </button>
        )}
      </div>
    </Shell>
  )
}

// ── CONTROL_TOGGLE ────────────────────────────────────────────────────────────

function ControlToggleWidget({ config }: { config: Record<string, unknown> }) {
  const physicalDeviceId = config.physicalDeviceId as string | undefined
  const configIeeeAddr = config.ieeeAddr as string | undefined
  const label = String(config.label ?? 'Toggle')
  const statePayloadKey = String(config.statePayloadKey ?? 'state')
  const onPayload = (config.onPayload ?? { state: 'ON' }) as Record<string, unknown>
  const offPayload = (config.offPayload ?? { state: 'OFF' }) as Record<string, unknown>

  const { device, state } = useDeviceState(physicalDeviceId || undefined)
  const ieeeAddr = configIeeeAddr || device?.protocolAddress

  const rawState = readPayload(state, statePayloadKey)
  const isOn =
    rawState === 'ON' ||
    rawState === true ||
    (typeof rawState === 'string' && rawState.toLowerCase() === 'on')

  const mutation = useMutation({
    mutationFn: (on: boolean) => sendCommand(ieeeAddr!, on ? onPayload : offPayload),
    onError: () => toast.error('Command failed'),
  })

  return (
    <Shell>
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4">
        <ToggleRight
          className={cn(
            'h-8 w-8',
            isOn ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600',
          )}
        />
        <p className="text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
          {label}
        </p>
        <button
          onClick={() => { if (ieeeAddr) mutation.mutate(!isOn) }}
          disabled={mutation.isPending || !ieeeAddr}
          className={cn(
            'relative h-7 w-12 rounded-full transition-colors disabled:opacity-50',
            isOn ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
          )}
        >
          <span
            className={cn(
              'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all',
              isOn ? 'left-6' : 'left-1',
            )}
          />
        </button>
      </div>
    </Shell>
  )
}

// ── SCENARIO_TRIGGER ──────────────────────────────────────────────────────────

function ScenarioTriggerWidget({ config }: { config: Record<string, unknown> }) {
  const scenarioId = config.scenarioId as string | undefined
  const label = String(config.label ?? 'Run')
  const buttonStyle = String(config.buttonStyle ?? 'primary')
  const confirmRequired = config.confirmRequired === true
  const [confirming, setConfirming] = useState(false)

  const mutation = useMutation({
    mutationFn: () => triggerScenario(scenarioId!),
    onSuccess: () => { toast.success(`${label}: triggered`); setConfirming(false) },
    onError: () => { toast.error('Trigger failed'); setConfirming(false) },
  })

  const colorClass =
    buttonStyle === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : buttonStyle === 'success'
        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white'

  return (
    <Shell>
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4">
        <Zap className="h-6 w-6 text-amber-400" />
        {confirming ? (
          <div className="flex gap-2">
            <button
              onClick={() => mutation.mutate()}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (!scenarioId) return toast.error('No scenario ID')
              if (confirmRequired && !confirming) return setConfirming(true)
              mutation.mutate()
            }}
            disabled={mutation.isPending || !scenarioId}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
              colorClass,
            )}
          >
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {label}
          </button>
        )}
      </div>
    </Shell>
  )
}

// ── GAUGE_DIAL ────────────────────────────────────────────────────────────────

function GaugeDialWidget({ config }: { config: Record<string, unknown> }) {
  const physicalDeviceId = config.physicalDeviceId as string | undefined
  const payloadKey = String(config.payloadKey ?? 'value')
  const label = config.label as string | undefined
  const unit = config.unit as string | undefined
  const min = Number(config.min ?? 0)
  const max = Number(config.max ?? 100)
  const accent = String(config.accent ?? 'green')
  const chips = (config.chips as string[]) ?? []

  const { state } = useDeviceState(physicalDeviceId || undefined)
  const rawValue = readPayload(state, payloadKey)
  const value = rawValue != null ? Number(rawValue) : (min + max) / 2
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)))

  const strokeColor =
    accent === 'blue' ? '#3b82f6' : accent === 'amber' ? '#f59e0b' : accent === 'red' ? '#ef4444' : '#10b981'

  // Semicircle arc: from left (180°) to right (0°), counter-clockwise via top
  const r = 40; const cx = 60; const cy = 56
  const toXY = (a: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
  const start = toXY(Math.PI)
  const end = toXY(0)
  const valAngle = Math.PI - pct * Math.PI
  const valPt = toXY(valAngle)

  const bgArc = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`
  const valArc = pct > 0
    ? `M ${start.x} ${start.y} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${valPt.x} ${valPt.y}`
    : ''

  return (
    <Shell>
      <div className="flex h-full flex-col items-center justify-between px-3 pb-3 pt-3">
        {label && (
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        )}
        <div className="flex w-full flex-1 items-center justify-center">
          <svg viewBox="0 0 120 68" className="w-full max-w-[160px]">
            <path d={bgArc} fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
            {valArc && (
              <path d={valArc} fill="none" stroke={strokeColor} strokeWidth="8" strokeLinecap="round" />
            )}
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">
              {rawValue != null ? (typeof rawValue === 'number' ? rawValue.toFixed(1) : String(rawValue)) : '—'}
            </text>
            {unit && (
              <text x={cx} y={cy + 16} textAnchor="middle" fontSize="7" fill="#94a3b8">{unit}</text>
            )}
            <text x={start.x + 4} y={start.y - 4} textAnchor="start" fontSize="7" fill="#94a3b8">{min}</text>
            <text x={end.x - 4} y={end.y - 4} textAnchor="end" fontSize="7" fill="#94a3b8">{max}</text>
          </svg>
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </Shell>
  )
}

// ── CIRCULAR_PROGRESS ─────────────────────────────────────────────────────────

function CircularProgressWidget({ config }: { config: Record<string, unknown> }) {
  const physicalDeviceId = config.physicalDeviceId as string | undefined
  const payloadKey = config.payloadKey as string | undefined
  const title = String(config.title ?? 'Progress')
  const subtitle = config.subtitle as string | undefined
  const staticValue = Number(config.staticValue ?? 0)
  const max = Number(config.max ?? 100)
  const unit = config.unit as string | undefined
  const badge = config.badge as string | undefined
  const accent = String(config.accent ?? 'green')

  const { state } = useDeviceState(physicalDeviceId || undefined)
  const rawValue = physicalDeviceId && payloadKey ? readPayload(state, payloadKey) : null
  const value = rawValue != null ? Number(rawValue) : staticValue
  const pct = Math.max(0, Math.min(100, (value / max) * 100))

  const strokeColor =
    accent === 'blue' ? '#3b82f6' : accent === 'amber' ? '#f59e0b' : accent === 'red' ? '#ef4444' : '#10b981'

  const r = 45
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - pct / 100)

  return (
    <Shell>
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-4">
        <div className="relative flex items-center justify-center">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="60" cy="60" r={r} fill="none" stroke={strokeColor} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {Math.round(pct)}{unit}
            </span>
            {badge && (
              <span className="mt-0.5 rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {badge}
              </span>
            )}
          </div>
        </div>
        <p className="text-center text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
          {title}
        </p>
        {subtitle && <p className="text-center text-xs text-slate-400">{subtitle}</p>}
      </div>
    </Shell>
  )
}

// ── SLIDER_CONTROL ────────────────────────────────────────────────────────────

function SliderControlWidget({ config }: { config: Record<string, unknown> }) {
  const physicalDeviceId = config.physicalDeviceId as string | undefined
  const configIeeeAddr = config.ieeeAddr as string | undefined
  const label = String(config.label ?? 'Value')
  const payloadKey = String(config.payloadKey ?? 'value')
  const commandKey = String(config.commandKey ?? payloadKey)
  const min = Number(config.min ?? 0)
  const max = Number(config.max ?? 100)
  const step = Number(config.step ?? 1)
  const unit = config.unit as string | undefined
  const subtitle = config.subtitle as string | undefined
  const accent = String(config.accent ?? 'green')

  const { device, state } = useDeviceState(physicalDeviceId || undefined)
  const ieeeAddr = configIeeeAddr || device?.protocolAddress

  const rawValue = readPayload(state, payloadKey)
  const current = rawValue != null ? Number(rawValue) : min
  const [local, setLocal] = useState<number | null>(null)
  const display = local ?? current

  const mutation = useMutation({
    mutationFn: (val: number) => sendCommand(ieeeAddr!, { [commandKey]: val }),
    onError: () => toast.error('Command failed'),
  })

  const accentColor =
    accent === 'blue' ? '#3b82f6' : accent === 'amber' ? '#f59e0b' : '#10b981'

  return (
    <Shell>
      <div className="flex h-full flex-col justify-center gap-3 px-5 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
          <span className="tabular-nums text-sm font-medium text-slate-700 dark:text-slate-300">
            {Math.round(display)}{unit}
          </span>
        </div>
        {subtitle && <p className="-mt-2 text-xs text-slate-400">{subtitle}</p>}
        <input
          type="range"
          min={min} max={max} step={step} value={display}
          disabled={!ieeeAddr}
          onChange={(e) => setLocal(Number(e.target.value))}
          onMouseUp={() => {
            if (local !== null && ieeeAddr) { mutation.mutate(local); setLocal(null) }
          }}
          onTouchEnd={() => {
            if (local !== null && ieeeAddr) { mutation.mutate(local); setLocal(null) }
          }}
          style={{ accentColor }}
          className="w-full cursor-pointer disabled:opacity-50"
        />
      </div>
    </Shell>
  )
}

// ── DEVICE_HERO ───────────────────────────────────────────────────────────────

const HERO_ICONS: Record<string, React.ReactNode> = {
  camera: <Camera className="h-7 w-7" />,
  lightbulb: <Lightbulb className="h-7 w-7" />,
  fan: <Fan className="h-7 w-7" />,
  lock: <Lock className="h-7 w-7" />,
  thermometer: <Thermometer className="h-7 w-7" />,
  sparkles: <Activity className="h-7 w-7" />,
  broom: <Activity className="h-7 w-7" />,
}

function DeviceHeroWidget({ config }: { config: Record<string, unknown> }) {
  const physicalDeviceId = config.physicalDeviceId as string | undefined
  const configIeeeAddr = config.ieeeAddr as string | undefined
  const title = String(config.title ?? 'Device')
  const subtitle = config.subtitle as string | undefined
  const icon = String(config.icon ?? 'lightbulb')
  const showToggle = config.showToggle === true
  const togglePayloadKey = String(config.togglePayloadKey ?? 'state')
  const onPayload = (config.onPayload ?? { state: 'ON' }) as Record<string, unknown>
  const offPayload = (config.offPayload ?? { state: 'OFF' }) as Record<string, unknown>
  const chips = (config.chips as string[]) ?? []
  const stats = (config.stats as Array<{ key: string; caption: string; unit?: string }>) ?? []
  const accent = String(config.accent ?? 'green')

  const { device, state } = useDeviceState(physicalDeviceId || undefined)
  const ieeeAddr = configIeeeAddr || device?.protocolAddress

  const rawState = readPayload(state, togglePayloadKey)
  const isOn =
    rawState === 'ON' ||
    rawState === true ||
    (typeof rawState === 'string' && rawState.toLowerCase() === 'on')

  const toggleMutation = useMutation({
    mutationFn: (on: boolean) => sendCommand(ieeeAddr!, on ? onPayload : offPayload),
    onError: () => toast.error('Command failed'),
  })

  const accentBg =
    accent === 'blue'
      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      : accent === 'amber'
        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
        : accent === 'slate'
          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'

  return (
    <Shell>
      <div className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', accentBg)}>
            {HERO_ICONS[icon] ?? <Activity className="h-7 w-7" />}
          </div>
          {showToggle && (
            <button
              onClick={() => { if (ieeeAddr) toggleMutation.mutate(!isOn) }}
              disabled={toggleMutation.isPending || !ieeeAddr}
              className={cn(
                'relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50',
                isOn ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
              )}
            >
              <span
                className={cn(
                  'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all',
                  isOn ? 'left-6' : 'left-1',
                )}
              />
            </button>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {chip}
              </span>
            ))}
          </div>
        )}
        {stats.length > 0 && (
          <div className="mt-auto flex flex-col gap-1 border-t border-slate-100 pt-2 dark:border-slate-800">
            {stats.map((s) => {
              const val = readPayload(state, s.key)
              return (
                <div key={s.key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{s.caption}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {val != null ? String(val) : '—'}{s.unit}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Shell>
  )
}

// ── MINI_LINE_CHART ───────────────────────────────────────────────────────────

function MiniLineChartWidget({ config }: { config: Record<string, unknown> }) {
  const physicalDeviceId = config.physicalDeviceId as string | undefined
  const payloadKey = String(config.payloadKey ?? 'value')
  const title = String(config.title ?? 'Chart')
  const unit = config.unit as string | undefined
  const accent = String(config.accent ?? 'green')

  const { state } = useDeviceState(physicalDeviceId || undefined)
  const rawValue = readPayload(state, payloadKey)

  const strokeColor =
    accent === 'blue' ? '#3b82f6' : accent === 'amber' ? '#f59e0b' : accent === 'red' ? '#ef4444' : '#10b981'

  return (
    <Shell>
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          {rawValue != null && (
            <span className="tabular-nums text-sm font-medium" style={{ color: strokeColor }}>
              {typeof rawValue === 'number' ? rawValue.toFixed(1) : String(rawValue)}{unit}
            </span>
          )}
        </div>
        <div className="flex flex-1 items-end">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full opacity-50">
            <polyline
              points="0,35 12,30 24,22 36,25 48,18 60,20 72,13 84,16 96,8 100,5"
              fill="none" stroke={strokeColor} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-xs text-slate-400">
          {rawValue != null ? `Now: ${rawValue}${unit ?? ''}` : 'No real-time data'}
        </p>
      </div>
    </Shell>
  )
}

// ── MODBUS_REGISTER_VALUE ─────────────────────────────────────────────────────

function ModbusRegisterValueWidget({ config }: { config: Record<string, unknown> }) {
  const deviceId = config.modbusDeviceId as string | undefined
  const registerId = config.modbusRegisterId as string | undefined
  const label = config.label as string | undefined
  const unit = config.unit as string | undefined
  const accent = String(config.accent ?? 'green')

  const strokeColor =
    accent === 'blue' ? '#3b82f6' : accent === 'amber' ? '#f59e0b' : accent === 'red' ? '#ef4444' : '#10b981'

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['modbus-reg', deviceId, registerId],
    queryFn: () => readModbusRegister(deviceId!, registerId!),
    enabled: !!deviceId && !!registerId,
    refetchInterval: Number(config.refreshInterval ?? 30) * 1000,
    staleTime: 5_000,
  })

  const value = data?.scaledValues?.[0] ?? null
  const formatted = value != null ? value.toFixed(2) : '—'

  return (
    <Shell>
      <div className="flex h-full flex-col items-center justify-center gap-1 px-3 py-3">
        {label && (
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        )}
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold tabular-nums text-slate-900 dark:text-slate-100" style={{ color: value != null ? strokeColor : undefined }}>
            {formatted}
          </span>
          {unit && <span className="mb-1 text-lg text-slate-400">{unit}</span>}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-1 rounded-md p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50 dark:hover:text-slate-300"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
        </button>
      </div>
    </Shell>
  )
}

// ── MODBUS_REGISTER_CONTROL ───────────────────────────────────────────────────

function ModbusRegisterControlWidget({ config }: { config: Record<string, unknown> }) {
  const deviceId = config.modbusDeviceId as string | undefined
  const registerId = config.modbusRegisterId as string | undefined
  const label = config.label as string | undefined
  const controlType = String(config.controlType ?? 'coil')

  const [numericValue, setNumericValue] = useState<string>('')

  const { data, refetch } = useQuery({
    queryKey: ['modbus-reg', deviceId, registerId],
    queryFn: () => readModbusRegister(deviceId!, registerId!),
    enabled: !!deviceId && !!registerId,
    staleTime: 10_000,
  })

  const currentCoil = (data?.rawValues?.[0] ?? 0) !== 0

  const writeMutation = useMutation({
    mutationFn: (body: { coil?: boolean; value?: number; scaledValue?: number }) =>
      writeModbusRegister(deviceId!, registerId!, body),
    onSuccess: () => refetch(),
    onError: () => toast.error('Write failed'),
  })

  const canWrite = !!deviceId && !!registerId

  return (
    <Shell>
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4">
        {label && (
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        )}
        {controlType === 'coil' ? (
          <>
            <ToggleRight
              className={cn('h-8 w-8', currentCoil ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600')}
            />
            <button
              onClick={() => { if (canWrite) writeMutation.mutate({ coil: !currentCoil }) }}
              disabled={writeMutation.isPending || !canWrite}
              className={cn(
                'relative h-7 w-12 rounded-full transition-colors disabled:opacity-50',
                currentCoil ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
              )}
            >
              <span
                className={cn(
                  'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all',
                  currentCoil ? 'left-6' : 'left-1',
                )}
              />
            </button>
          </>
        ) : (
          <div className="flex w-full flex-col gap-2">
            <input
              type="number"
              value={numericValue}
              onChange={(e) => setNumericValue(e.target.value)}
              placeholder={data?.scaledValues?.[0]?.toFixed(2) ?? '0'}
              disabled={!canWrite}
              className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-slate-700 dark:text-slate-100"
            />
            <button
              onClick={() => {
                const v = parseFloat(numericValue)
                if (!isNaN(v) && canWrite) {
                  writeMutation.mutate({ scaledValue: v })
                  setNumericValue('')
                }
              }}
              disabled={writeMutation.isPending || !canWrite || numericValue === ''}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {writeMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Write
            </button>
          </div>
        )}
      </div>
    </Shell>
  )
}

// ── Widget dispatcher ─────────────────────────────────────────────────────────

export function WidgetRenderer({ widget }: { widget: WidgetInstance }) {
  switch (widget.type) {
    case 'TEXT_LABEL':        return <TextLabelWidget config={widget.config} />
    case 'TELEMETRY_VALUE':   return <TelemetryValueWidget config={widget.config} />
    case 'DEVICE_STATUS':     return <DeviceStatusWidget config={widget.config} />
    case 'CONTROL_BUTTON':    return <ControlButtonWidget config={widget.config} />
    case 'CONTROL_TOGGLE':    return <ControlToggleWidget config={widget.config} />
    case 'SCENARIO_TRIGGER':  return <ScenarioTriggerWidget config={widget.config} />
    case 'GAUGE_DIAL':        return <GaugeDialWidget config={widget.config} />
    case 'CIRCULAR_PROGRESS': return <CircularProgressWidget config={widget.config} />
    case 'SLIDER_CONTROL':    return <SliderControlWidget config={widget.config} />
    case 'DEVICE_HERO':       return <DeviceHeroWidget config={widget.config} />
    case 'MINI_LINE_CHART':         return <MiniLineChartWidget config={widget.config} />
    case 'MODBUS_REGISTER_VALUE':   return <ModbusRegisterValueWidget config={widget.config} />
    case 'MODBUS_REGISTER_CONTROL': return <ModbusRegisterControlWidget config={widget.config} />
    default:
      return (
        <Shell>
          <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
            <AlertCircle className="h-6 w-6 text-slate-300" />
            <p className="text-xs text-slate-400">{widget.type}</p>
          </div>
        </Shell>
      )
  }
}

// ── Height helper ─────────────────────────────────────────────────────────────

function itemHeight(h: number): number {
  // ROW_H px per row unit + 12px gap between rows
  return h * ROW_H + (h - 1) * 12
}

// ── Public export ─────────────────────────────────────────────────────────────

export function WidgetGrid({ dashboard }: { dashboard: LocalWidgetDashboard }) {
  const { widgets, layouts } = dashboard
  if (widgets.length === 0) return null

  const layoutArr: WidgetLayout[] = layouts.lg ?? layouts.md ?? layouts.sm ?? []

  // Build ordered list of (pos, widget) pairs
  const pairs: Array<{ pos: WidgetLayout; widget: WidgetInstance }> = layoutArr.length
    ? layoutArr
        .slice()
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .flatMap((pos) => {
          const w = widgets.find((w) => w.id === pos.i)
          return w ? [{ pos, widget: w }] : []
        })
    : widgets.map((w, i) => ({
        pos: { i: w.id, x: (i % 3) * 4, y: Math.floor(i / 3) * 3, w: 4, h: 3 },
        widget: w,
      }))

  const minY = Math.min(...pairs.map(({ pos }) => pos.y))
  const maxRow = Math.max(...pairs.map(({ pos }) => pos.y - minY + pos.h))

  return (
    <>
      {/* ── Exact RGL-position grid on lg+ screens ── */}
      <div
        className="hidden lg:grid"
        style={{
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: `repeat(${maxRow}, ${ROW_H}px)`,
          gap: '12px',
        }}
      >
        {pairs.map(({ pos, widget }) => (
          <div
            key={widget.id}
            style={{
              gridColumn: `${pos.x + 1} / span ${Math.min(pos.w, 12 - pos.x)}`,
              gridRow: `${pos.y - minY + 1} / span ${pos.h}`,
            }}
          >
            <WidgetRenderer widget={widget} />
          </div>
        ))}
      </div>

      {/* ── Auto responsive grid on < lg screens ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {pairs.map(({ pos, widget }) => (
          <div key={widget.id} style={{ height: itemHeight(Math.min(pos.h, 5)) }}>
            <WidgetRenderer widget={widget} />
          </div>
        ))}
      </div>
    </>
  )
}
