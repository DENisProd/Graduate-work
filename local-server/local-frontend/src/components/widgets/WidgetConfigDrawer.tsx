import { useState, useEffect } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { Radio, Cable } from 'lucide-react'
import type { WidgetInstance } from '@/api/widget-dashboards'
import type { PhysicalDevice, Scenario, ZigbeeState, ModbusDevice, ModbusRegister } from '@/types'
import { getZigbeeStates } from '@/api/zigbee'
import { listModbusDevices, listModbusRegisters } from '@/api/modbus'
import type { CommandValueType, WidgetCommandSource } from './command-value'

interface Props {
  widget: WidgetInstance | null
  devices: PhysicalDevice[]
  scenarios: Scenario[]
  onClose: () => void
  onSave: (widget: WidgetInstance) => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>}
      {children}
    </div>
  )
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
    />
  )
}

function NumberInput({ value, onChange, placeholder, step }: { value: number | undefined; onChange: (v: number | undefined) => void; placeholder?: string; step?: number }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      step={step}
      onChange={e => {
        const raw = e.target.value
        if (raw === '') return onChange(undefined)
        const n = Number(raw)
        onChange(Number.isNaN(n) ? undefined : n)
      }}
      placeholder={placeholder}
      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
    />
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
    >
      <option value="">— выберите —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function PayloadKeySelect({ value, onChange, state, placeholder }: { value: string; onChange: (v: string) => void; state: ZigbeeState | undefined; placeholder?: string }) {
  const keys = state
    ? Array.from(new Set([
        ...(['state', 'brightness', 'temperature', 'humidity', 'battery', 'occupancy', 'linkquality', 'colorMode'] as const).filter(k => (state as unknown as Record<string, unknown>)[k] !== undefined),
        ...Object.keys(state.payload ?? {}),
      ]))
    : []

  if (keys.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
        />
        <span className="text-[10px] text-slate-400">Телеметрия ещё не получена — введите ключ вручную</span>
      </div>
    )
  }
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
    >
      <option value="">— выберите ключ —</option>
      {keys.map(k => <option key={k} value={k}>{k}</option>)}
    </select>
  )
}

function ChipsEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('')
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((c, i) => (
          <span key={c + i} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {c}
            <button onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) { e.preventDefault(); if (value.length < 3) onChange([...value, draft.trim()]); setDraft('') } }}
          placeholder="Добавить тег + Enter"
          className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
        />
        <button
          onClick={() => { if (draft.trim() && value.length < 3) { onChange([...value, draft.trim()]); setDraft('') } }}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          +
        </button>
      </div>
      <p className="text-[10px] text-slate-400">До 3 тегов</p>
    </div>
  )
}

type StatEntry = { key: string; icon: string; caption: string; unit?: string }

function StatsEditor({ value, onChange, state }: { value: StatEntry[]; onChange: (v: StatEntry[]) => void; state: ZigbeeState | undefined }) {
  const ICON_OPTS = [
    { value: 'cube', label: 'Куб (площадь)' },
    { value: 'bolt', label: 'Молния (батарея/энергия)' },
    { value: 'clock', label: 'Часы (время)' },
    { value: 'droplet', label: 'Капля (влажность)' },
    { value: 'flame', label: 'Огонь (нагрев)' },
    { value: 'leaf', label: 'Лист (эко)' },
  ]
  function update(i: number, patch: Partial<StatEntry>) {
    onChange(value.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }
  return (
    <div className="flex flex-col gap-2">
      {value.map((stat, i) => (
        <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <PayloadKeySelect value={stat.key} onChange={v => update(i, { key: v })} state={state} placeholder="payload-ключ" />
            <select value={stat.icon} onChange={e => update(i, { icon: e.target.value })} className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100">
              {ICON_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-[1fr_80px_auto] gap-2">
            <input value={stat.caption} onChange={e => update(i, { caption: e.target.value })} placeholder="Подпись" className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" />
            <input value={stat.unit ?? ''} onChange={e => update(i, { unit: e.target.value })} placeholder="ед." className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" />
            <button onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="px-2 py-1 text-xs rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">Удалить</button>
          </div>
        </div>
      ))}
      {value.length < 3 && (
        <button onClick={() => onChange([...value, { key: '', icon: 'bolt', caption: 'Новая метрика', unit: '' }])} className="text-xs px-2 py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
          + Добавить метрику
        </button>
      )}
    </div>
  )
}

function SourceSwitch({ value, onChange }: { value: WidgetCommandSource; onChange: (v: WidgetCommandSource) => void }) {
  return (
    <div role="tablist" className="flex gap-1 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
      {(['zigbee', 'modbus'] as const).map(opt => (
        <button
          key={opt}
          type="button"
          role="tab"
          aria-selected={value === opt}
          onClick={() => onChange(opt)}
          className={`flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-2 transition-colors ${
            value === opt ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center gap-1.5 text-xs font-medium">
            {opt === 'zigbee' ? <Radio className="h-3.5 w-3.5" /> : <Cable className="h-3.5 w-3.5" />}
            {opt === 'zigbee' ? 'Zigbee' : 'Modbus'}
          </span>
          <span className={`text-[10px] font-normal ${value === opt ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
            {opt === 'zigbee' ? 'беспроводное устройство' : 'реле / провод (RS-485)'}
          </span>
        </button>
      ))}
    </div>
  )
}

function CommandValueEditor({
  commandKey,
  commandValue,
  commandValueType,
  onChange,
}: {
  commandKey: string
  commandValue: string
  commandValueType: CommandValueType
  onChange: (updates: { commandKey?: string; commandValue?: string; commandValueType?: CommandValueType }) => void
}) {
  const isQuickOn = commandValueType === 'text' && commandValue === 'ON'
  const isQuickOff = commandValueType === 'text' && commandValue === 'OFF'
  const isCustom = !isQuickOn && !isQuickOff

  return (
    <>
      <Field label="Ключ команды">
        <Input value={commandKey} onChange={v => onChange({ commandKey: v })} placeholder="state" />
      </Field>
      <Field label="Значение">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ commandValue: 'ON', commandValueType: 'text' })}
            className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${isQuickOn ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            ВКЛ
          </button>
          <button
            type="button"
            onClick={() => onChange({ commandValue: 'OFF', commandValueType: 'text' })}
            className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${isQuickOff ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            ВЫКЛ
          </button>
          <button
            type="button"
            onClick={() => { if (!isCustom) onChange({ commandValue: '', commandValueType: 'text' }) }}
            className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${isCustom ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            Другое…
          </button>
        </div>
      </Field>
      {isCustom && (
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <select
            value={commandValueType}
            onChange={e => onChange({ commandValueType: e.target.value as CommandValueType })}
            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
          >
            <option value="text">Текст</option>
            <option value="number">Число</option>
            <option value="boolean">Логическое</option>
          </select>
          {commandValueType === 'boolean' ? (
            <select
              value={commandValue === 'true' ? 'true' : 'false'}
              onChange={e => onChange({ commandValue: e.target.value })}
              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <input
              type={commandValueType === 'number' ? 'number' : 'text'}
              value={commandValue}
              onChange={e => onChange({ commandValue: e.target.value })}
              className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
            />
          )}
        </div>
      )}
    </>
  )
}

function ModbusTargetEditor({
  modbusDeviceId,
  modbusRegisterId,
  allowedTypes,
  modbusDevices,
  registers,
  onSelectDevice,
  onSelectRegister,
}: {
  modbusDeviceId: string
  modbusRegisterId: string
  allowedTypes: Array<'coil' | 'holding'>
  modbusDevices: ModbusDevice[]
  registers: ModbusRegister[]
  onSelectDevice: (deviceId: string) => void
  onSelectRegister: (registerId: string, registerType?: 'coil' | 'holding') => void
}) {
  const deviceOptions = modbusDevices.map(d => ({ value: d.id, label: d.name }))
  const registerOptions = registers
    .filter(r => r.writable && allowedTypes.includes(r.registerType as 'coil' | 'holding'))
    .map(r => ({ value: r.id, label: `${r.name} (${r.registerType} @${r.address})` }))

  return (
    <>
      <Field label="Modbus устройство">
        <Select value={modbusDeviceId} onChange={onSelectDevice} options={deviceOptions} />
      </Field>
      <Field label="Регистр">
        <Select
          value={modbusRegisterId}
          onChange={v => {
            const reg = registers.find(r => r.id === v)
            onSelectRegister(v, reg?.registerType as 'coil' | 'holding' | undefined)
          }}
          options={registerOptions}
        />
      </Field>
    </>
  )
}

function widgetUsesModbus(type: string | undefined): boolean {
  return (
    type === 'CONTROL_BUTTON' ||
    type === 'CONTROL_TOGGLE' ||
    type === 'DEVICE_HERO' ||
    type === 'DEVICE_GROUP' ||
    type === 'MODBUS_REGISTER_VALUE' ||
    type === 'MODBUS_REGISTER_CONTROL'
  )
}

function getActiveModbusDeviceId(type: string | undefined, config: Record<string, unknown> | null): string {
  if (!config) return ''
  if (type === 'DEVICE_HERO') return (config.toggleModbusDeviceId as string) ?? ''
  return (config.modbusDeviceId as string) ?? ''
}

type DeviceGroupItem = {
  id: string
  label: string
  source: WidgetCommandSource
  physicalDeviceId?: string
  ieeeAddr?: string
  statePayloadKey?: string
  onValue?: string
  offValue?: string
  modbusDeviceId?: string
  modbusRegisterId?: string
}

function nanoid() {
  return Math.random().toString(36).slice(2, 10)
}

function GroupItemsEditor({
  items,
  onChange,
  deviceOptions,
  devices,
  modbusDevices,
  registersByDeviceId,
}: {
  items: DeviceGroupItem[]
  onChange: (items: DeviceGroupItem[]) => void
  deviceOptions: { value: string; label: string }[]
  devices: PhysicalDevice[]
  modbusDevices: ModbusDevice[]
  registersByDeviceId: Record<string, ModbusRegister[]>
}) {
  function update(i: number, patch: Partial<DeviceGroupItem>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i))
  }
  function add() {
    onChange([...items, { id: nanoid(), label: '', source: 'zigbee' }])
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input value={item.label} onChange={v => update(i, { label: v })} placeholder={`Устройство ${i + 1}`} />
            <button onClick={() => remove(i)} className="px-2 py-1.5 text-xs rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0">
              Удалить
            </button>
          </div>
          <SourceSwitch value={item.source} onChange={v => update(i, { source: v })} />
          {item.source === 'zigbee' ? (
            <>
              <Select
                value={item.physicalDeviceId ?? ''}
                onChange={v => {
                  const dev = devices.find(d => d.id === v)
                  update(i, { physicalDeviceId: v, ieeeAddr: dev?.protocolAddress ?? '' })
                }}
                options={deviceOptions}
              />
              <p className="text-[10px] text-slate-400">Ключ состояния / значение ВКЛ / значение ВЫКЛ</p>
              <div className="grid grid-cols-3 gap-2">
                <Input value={item.statePayloadKey ?? ''} onChange={v => update(i, { statePayloadKey: v })} placeholder="state" />
                <Input value={item.onValue ?? ''} onChange={v => update(i, { onValue: v })} placeholder="ON" />
                <Input value={item.offValue ?? ''} onChange={v => update(i, { offValue: v })} placeholder="OFF" />
              </div>
            </>
          ) : (
            <ModbusTargetEditor
              modbusDeviceId={item.modbusDeviceId ?? ''}
              modbusRegisterId={item.modbusRegisterId ?? ''}
              allowedTypes={['coil']}
              modbusDevices={modbusDevices}
              registers={registersByDeviceId[item.modbusDeviceId ?? ''] ?? []}
              onSelectDevice={v => update(i, { modbusDeviceId: v, modbusRegisterId: '' })}
              onSelectRegister={v => update(i, { modbusRegisterId: v })}
            />
          )}
        </div>
      ))}
      <button
        onClick={add}
        className="text-xs px-2 py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
      >
        + Добавить устройство
      </button>
    </div>
  )
}

export function WidgetConfigDrawer({ widget, devices, scenarios, onClose, onSave }: Props) {
  const [config, setConfig] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (widget) setConfig(JSON.parse(JSON.stringify(widget.config)))
  }, [widget])

  const selectedPhysicalDeviceId = (config?.physicalDeviceId as string) ?? ''
  const selectedDevice = devices.find(d => d.id === selectedPhysicalDeviceId)

  const zigbeeStateQ = useQuery({
    queryKey: ['config-drawer-zstate', selectedDevice?.protocolAddress],
    queryFn: () => getZigbeeStates(selectedDevice!.protocolAddress, 1),
    enabled: !!selectedDevice?.protocolAddress,
    staleTime: 30_000,
  })
  const zigbeeState = zigbeeStateQ.data?.[0]

  const selectedModbusDeviceId = getActiveModbusDeviceId(widget?.type, config)

  const modbusDevicesQ = useQuery({
    queryKey: ['modbus-devices'],
    queryFn: listModbusDevices,
    staleTime: 60_000,
    enabled: widgetUsesModbus(widget?.type),
  })

  const modbusRegistersQ = useQuery({
    queryKey: ['modbus-registers', selectedModbusDeviceId],
    queryFn: () => listModbusRegisters(selectedModbusDeviceId),
    enabled: !!selectedModbusDeviceId,
    staleTime: 30_000,
  })

  const groupItems = widget?.type === 'DEVICE_GROUP' ? ((config?.items as DeviceGroupItem[]) ?? []) : []
  const groupModbusDeviceIds = Array.from(new Set(groupItems.filter(i => i.source === 'modbus' && i.modbusDeviceId).map(i => i.modbusDeviceId as string)))

  const groupModbusRegistersQ = useQueries({
    queries: groupModbusDeviceIds.map(id => ({
      queryKey: ['modbus-registers', id],
      queryFn: () => listModbusRegisters(id),
      staleTime: 30_000,
    })),
  })

  const groupRegistersByDeviceId: Record<string, ModbusRegister[]> = {}
  groupModbusDeviceIds.forEach((id, idx) => {
    groupRegistersByDeviceId[id] = groupModbusRegistersQ[idx]?.data ?? []
  })

  if (!widget || !config) return null

  function patch(updates: Record<string, unknown>) {
    setConfig(prev => ({ ...prev!, ...updates }))
  }

  const deviceOptions = devices.map(d => ({ value: d.id, label: d.friendlyName ?? d.name ?? d.id }))
  const scenarioOptions = scenarios.map(s => ({ value: s.id, label: s.name }))
  const modbusDeviceOptions = (modbusDevicesQ.data ?? []).map(d => ({ value: d.id, label: d.name }))
  const modbusRegisterOptions = (modbusRegistersQ.data ?? []).map(r => ({ value: r.id, label: `${r.name} (${r.registerType} @${r.address})` }))

  const ACCENT_OPTIONS = [
    { value: 'green', label: 'Зелёный' },
    { value: 'blue', label: 'Синий' },
    { value: 'amber', label: 'Жёлтый' },
    { value: 'red', label: 'Красный' },
  ]

  function renderFields() {
    if (!config) return null
    const type = widget!.type

    if (type === 'TELEMETRY_VALUE') {
      return (
        <>
          <Field label="Устройство">
            <Select value={selectedPhysicalDeviceId} onChange={v => { const dev = devices.find(d => d.id === v); patch({ physicalDeviceId: v, ieeeAddr: dev?.protocolAddress ?? '', payloadKey: '' }) }} options={deviceOptions} />
          </Field>
          <Field label="Ключ payload">
            <PayloadKeySelect value={(config.payloadKey as string) ?? ''} onChange={v => patch({ payloadKey: v })} state={zigbeeState} placeholder="temperature" />
          </Field>
          <Field label="Подпись виджета">
            <Input value={(config.label as string) ?? ''} onChange={v => patch({ label: v })} placeholder="Температура в гостиной" />
          </Field>
          <Field label="Единица измерения">
            <Input value={(config.unit as string) ?? ''} onChange={v => patch({ unit: v })} placeholder="°C" />
          </Field>
          <Field label="Тип отображения">
            <Select value={(config.displayVariant as string) ?? 'numeric'} onChange={v => patch({ displayVariant: v })} options={[{ value: 'numeric', label: 'Число' }, { value: 'badge', label: 'Метка (текст)' }, { value: 'boolean', label: 'Вкл/Выкл' }]} />
          </Field>
        </>
      )
    }

    if (type === 'DEVICE_STATUS') {
      return (
        <>
          <Field label="Устройство">
            <Select value={selectedPhysicalDeviceId} onChange={v => patch({ physicalDeviceId: v })} options={deviceOptions} />
          </Field>
          <Field label="Подпись (необязательно)">
            <Input value={(config.label as string) ?? ''} onChange={v => patch({ label: v })} placeholder={selectedDevice?.friendlyName ?? ''} />
          </Field>
          <Field label="">
            <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={!!config.showLastSeen} onChange={e => patch({ showLastSeen: e.target.checked })} className="rounded" />
              Показывать время последней активности
            </label>
          </Field>
        </>
      )
    }

    if (type === 'CONTROL_BUTTON') {
      const source = ((config.source as WidgetCommandSource) ?? 'zigbee')
      const registersForDevice = modbusRegistersQ.data ?? []
      return (
        <>
          <Field label="Источник команды">
            <SourceSwitch value={source} onChange={v => patch({ source: v })} />
          </Field>
          {source === 'zigbee' ? (
            <>
              <Field label="Устройство">
                <Select value={selectedPhysicalDeviceId} onChange={v => { const dev = devices.find(d => d.id === v); patch({ physicalDeviceId: v, ieeeAddr: dev?.protocolAddress ?? '' }) }} options={deviceOptions} />
              </Field>
              <CommandValueEditor
                commandKey={(config.commandKey as string) ?? 'state'}
                commandValue={(config.commandValue as string) ?? 'ON'}
                commandValueType={(config.commandValueType as CommandValueType) ?? 'text'}
                onChange={p => patch(p)}
              />
            </>
          ) : (
            <>
              <ModbusTargetEditor
                modbusDeviceId={(config.modbusDeviceId as string) ?? ''}
                modbusRegisterId={(config.modbusRegisterId as string) ?? ''}
                allowedTypes={['coil', 'holding']}
                modbusDevices={modbusDevicesQ.data ?? []}
                registers={registersForDevice}
                onSelectDevice={v => patch({ modbusDeviceId: v, modbusRegisterId: '', modbusRegisterType: undefined })}
                onSelectRegister={(v, regType) => patch({ modbusRegisterId: v, modbusRegisterType: regType })}
              />
              {(config.modbusRegisterType as string) === 'holding' ? (
                <Field label="Значение (число)">
                  <NumberInput
                    value={config.commandValue ? Number(config.commandValue) : undefined}
                    onChange={v => patch({ commandValue: v != null ? String(v) : '' })}
                  />
                </Field>
              ) : (
                <Field label="Значение">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => patch({ commandValue: 'true' })}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${config.commandValue === 'true' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                    >
                      ВКЛ
                    </button>
                    <button
                      type="button"
                      onClick={() => patch({ commandValue: 'false' })}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${config.commandValue === 'false' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                    >
                      ВЫКЛ
                    </button>
                  </div>
                </Field>
              )}
            </>
          )}
          <Field label="Текст кнопки">
            <Input value={(config.label as string) ?? ''} onChange={v => patch({ label: v })} placeholder="Включить" />
          </Field>
          <Field label="Стиль кнопки">
            <Select value={(config.buttonStyle as string) ?? 'primary'} onChange={v => patch({ buttonStyle: v })} options={[{ value: 'primary', label: 'Основной (синий)' }, { value: 'danger', label: 'Опасный (красный)' }, { value: 'ghost', label: 'Контурный' }]} />
          </Field>
          <Field label="">
            <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={!!config.confirmRequired} onChange={e => patch({ confirmRequired: e.target.checked })} className="rounded" />
              Подтверждение перед отправкой
            </label>
          </Field>
        </>
      )
    }

    if (type === 'CONTROL_TOGGLE') {
      const source = ((config.source as WidgetCommandSource) ?? 'zigbee')
      const registersForDevice = modbusRegistersQ.data ?? []
      return (
        <>
          <Field label="Источник">
            <SourceSwitch value={source} onChange={v => patch({ source: v })} />
          </Field>
          <Field label="Подпись">
            <Input value={(config.label as string) ?? ''} onChange={v => patch({ label: v })} placeholder="Свет в гостиной" />
          </Field>
          {source === 'zigbee' ? (
            <>
              <Field label="Устройство">
                <Select value={selectedPhysicalDeviceId} onChange={v => { const dev = devices.find(d => d.id === v); patch({ physicalDeviceId: v, ieeeAddr: dev?.protocolAddress ?? '', statePayloadKey: '' }) }} options={deviceOptions} />
              </Field>
              <Field label="Ключ состояния">
                <PayloadKeySelect value={(config.statePayloadKey as string) ?? ''} onChange={v => patch({ statePayloadKey: v })} state={zigbeeState} placeholder="state" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Значение ВКЛ">
                  <Input value={(config.onValue as string) ?? 'ON'} onChange={v => patch({ onValue: v })} placeholder="ON" />
                </Field>
                <Field label="Значение ВЫКЛ">
                  <Input value={(config.offValue as string) ?? 'OFF'} onChange={v => patch({ offValue: v })} placeholder="OFF" />
                </Field>
              </div>
            </>
          ) : (
            <ModbusTargetEditor
              modbusDeviceId={(config.modbusDeviceId as string) ?? ''}
              modbusRegisterId={(config.modbusRegisterId as string) ?? ''}
              allowedTypes={['coil']}
              modbusDevices={modbusDevicesQ.data ?? []}
              registers={registersForDevice}
              onSelectDevice={v => patch({ modbusDeviceId: v, modbusRegisterId: '' })}
              onSelectRegister={v => patch({ modbusRegisterId: v })}
            />
          )}
        </>
      )
    }

    if (type === 'SCENARIO_TRIGGER') {
      return (
        <>
          <Field label="Сценарий">
            <Select value={(config.scenarioId as string) ?? ''} onChange={v => patch({ scenarioId: v })} options={scenarioOptions} />
          </Field>
          <Field label="Текст кнопки">
            <Input value={(config.label as string) ?? ''} onChange={v => patch({ label: v })} placeholder="Запустить" />
          </Field>
          <Field label="Стиль">
            <Select value={(config.buttonStyle as string) ?? 'primary'} onChange={v => patch({ buttonStyle: v })} options={[{ value: 'primary', label: 'Основной' }, { value: 'success', label: 'Зелёный' }, { value: 'danger', label: 'Красный' }]} />
          </Field>
          <Field label="">
            <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={!!config.confirmRequired} onChange={e => patch({ confirmRequired: e.target.checked })} className="rounded" />
              Подтверждение перед запуском
            </label>
          </Field>
        </>
      )
    }

    if (type === 'TEXT_LABEL') {
      return (
        <>
          <Field label="Текст">
            <Input value={(config.text as string) ?? ''} onChange={v => patch({ text: v })} placeholder="Заголовок секции" />
          </Field>
          <Field label="Размер">
            <Select value={(config.fontSize as string) ?? 'lg'} onChange={v => patch({ fontSize: v })} options={[{ value: 'sm', label: 'Маленький' }, { value: 'md', label: 'Средний' }, { value: 'lg', label: 'Большой (заголовок)' }, { value: 'xl', label: 'Очень большой' }]} />
          </Field>
          <Field label="Выравнивание">
            <Select value={(config.align as string) ?? 'left'} onChange={v => patch({ align: v })} options={[{ value: 'left', label: 'По левому краю' }, { value: 'center', label: 'По центру' }, { value: 'right', label: 'По правому краю' }]} />
          </Field>
          <Field label="Стиль">
            <Select value={(config.style as string) ?? 'title'} onChange={v => patch({ style: v })} options={[{ value: 'title', label: 'Заголовок' }, { value: 'subtitle', label: 'Подзаголовок' }, { value: 'body', label: 'Текст' }, { value: 'divider', label: 'Разделитель' }]} />
          </Field>
        </>
      )
    }

    if (type === 'GAUGE_DIAL') {
      return (
        <>
          <Field label="Устройство">
            <Select value={selectedPhysicalDeviceId} onChange={v => { const dev = devices.find(d => d.id === v); patch({ physicalDeviceId: v, ieeeAddr: dev?.protocolAddress ?? '' }) }} options={deviceOptions} />
          </Field>
          <Field label="Ключ payload">
            <PayloadKeySelect value={(config.payloadKey as string) ?? ''} onChange={v => patch({ payloadKey: v })} state={zigbeeState} placeholder="temperature" />
          </Field>
          <Field label="Подпись">
            <Input value={(config.label as string) ?? ''} onChange={v => patch({ label: v })} placeholder="Климат-контроль" />
          </Field>
          <Field label="Единица измерения">
            <Input value={(config.unit as string) ?? ''} onChange={v => patch({ unit: v })} placeholder="°C" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Минимум"><NumberInput value={config.min as number} onChange={v => patch({ min: v ?? 0 })} placeholder="0" /></Field>
            <Field label="Максимум"><NumberInput value={config.max as number} onChange={v => patch({ max: v ?? 100 })} placeholder="100" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Жёлтый порог"><NumberInput value={config.warnAt as number | undefined} onChange={v => patch({ warnAt: v })} /></Field>
            <Field label="Красный порог"><NumberInput value={config.criticalAt as number | undefined} onChange={v => patch({ criticalAt: v })} /></Field>
          </div>
          <Field label="Теги-режимы"><ChipsEditor value={(config.chips as string[]) ?? []} onChange={v => patch({ chips: v })} /></Field>
          <Field label="Цвет акцента"><Select value={(config.accent as string) ?? 'green'} onChange={v => patch({ accent: v })} options={ACCENT_OPTIONS} /></Field>
        </>
      )
    }

    if (type === 'CIRCULAR_PROGRESS') {
      return (
        <>
          <Field label="Заголовок"><Input value={(config.title as string) ?? ''} onChange={v => patch({ title: v })} placeholder="Дом под контролем" /></Field>
          <Field label="Подзаголовок"><Input value={(config.subtitle as string) ?? ''} onChange={v => patch({ subtitle: v })} /></Field>
          <Field label="Устройство (необязательно)">
            <Select value={selectedPhysicalDeviceId} onChange={v => patch({ physicalDeviceId: v || undefined, payloadKey: v ? config.payloadKey : undefined })} options={deviceOptions} />
          </Field>
          {selectedPhysicalDeviceId && (
            <Field label="Ключ payload">
              <PayloadKeySelect value={(config.payloadKey as string) ?? ''} onChange={v => patch({ payloadKey: v })} state={zigbeeState} placeholder="battery" />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Статичное значение"><NumberInput value={config.staticValue as number | undefined} onChange={v => patch({ staticValue: v })} placeholder="78" /></Field>
            <Field label="Максимум"><NumberInput value={config.max as number} onChange={v => patch({ max: v ?? 100 })} placeholder="100" /></Field>
          </div>
          <Field label="Единица"><Input value={(config.unit as string) ?? ''} onChange={v => patch({ unit: v })} placeholder="%" /></Field>
          <Field label="Бейдж"><Input value={(config.badge as string) ?? ''} onChange={v => patch({ badge: v })} placeholder="Защищено" /></Field>
          <Field label="Цвет акцента"><Select value={(config.accent as string) ?? 'green'} onChange={v => patch({ accent: v })} options={ACCENT_OPTIONS} /></Field>
        </>
      )
    }

    if (type === 'SLIDER_CONTROL') {
      return (
        <>
          <Field label="Устройство">
            <Select value={selectedPhysicalDeviceId} onChange={v => { const dev = devices.find(d => d.id === v); patch({ physicalDeviceId: v, ieeeAddr: dev?.protocolAddress ?? '' }) }} options={deviceOptions} />
          </Field>
          <Field label="Подпись"><Input value={(config.label as string) ?? ''} onChange={v => patch({ label: v })} placeholder="Освещение" /></Field>
          <Field label="Подзаголовок"><Input value={(config.subtitle as string) ?? ''} onChange={v => patch({ subtitle: v })} /></Field>
          <Field label="Ключ чтения значения">
            <PayloadKeySelect value={(config.payloadKey as string) ?? ''} onChange={v => patch({ payloadKey: v, commandKey: config.commandKey || v })} state={zigbeeState} placeholder="brightness" />
          </Field>
          <Field label="Ключ команды (если отличается)">
            <Input value={(config.commandKey as string) ?? ''} onChange={v => patch({ commandKey: v })} placeholder="brightness" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Min"><NumberInput value={config.min as number} onChange={v => patch({ min: v ?? 0 })} placeholder="0" /></Field>
            <Field label="Max"><NumberInput value={config.max as number} onChange={v => patch({ max: v ?? 254 })} placeholder="254" /></Field>
            <Field label="Шаг"><NumberInput value={config.step as number | undefined} onChange={v => patch({ step: v })} placeholder="1" /></Field>
          </div>
          <Field label="Единица"><Input value={(config.unit as string) ?? ''} onChange={v => patch({ unit: v })} /></Field>
          <Field label="Цвет">
            <Select value={(config.accent as string) ?? 'green'} onChange={v => patch({ accent: v })} options={[{ value: 'green', label: 'Зелёный' }, { value: 'blue', label: 'Синий' }, { value: 'amber', label: 'Жёлтый' }]} />
          </Field>
        </>
      )
    }

    if (type === 'DEVICE_HERO') {
      return (
        <>
          <SectionHeader
            title="Отображение карточки"
            hint="Необязательно. Это Zigbee-устройство задаёт иконку, заголовок и метрики ниже. Если карточка управляет только Modbus-реле, можно оставить пустым."
          />
          <Field label="Устройство (Zigbee)">
            <Select value={selectedPhysicalDeviceId} onChange={v => { const dev = devices.find(d => d.id === v); patch({ physicalDeviceId: v, ieeeAddr: dev?.protocolAddress ?? '' }) }} options={deviceOptions} />
          </Field>
          <Field label="Заголовок"><Input value={(config.title as string) ?? ''} onChange={v => patch({ title: v })} placeholder="Передняя камера" /></Field>
          <Field label="Подзаголовок (модель)"><Input value={(config.subtitle as string) ?? ''} onChange={v => patch({ subtitle: v })} placeholder={selectedDevice?.model ?? ''} /></Field>
          <Field label="Иконка">
            <Select value={(config.icon as string) ?? 'lightbulb'} onChange={v => patch({ icon: v })} options={[
              { value: 'camera', label: 'Камера' }, { value: 'lightbulb', label: 'Лампочка' },
              { value: 'fan', label: 'Вентилятор' }, { value: 'lock', label: 'Замок' },
              { value: 'speaker', label: 'Колонка' }, { value: 'sparkles', label: 'Уборка/освежитель' },
              { value: 'thermometer', label: 'Термометр' }, { value: 'broom', label: 'Метла (пылесос)' },
            ]} />
          </Field>
          <Field label="">
            <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={!!config.showToggle} onChange={e => patch({ showToggle: e.target.checked })} className="rounded" />
              Показывать переключатель ON/OFF
            </label>
          </Field>
          {config.showToggle && (
            <>
              <SectionHeader
                title="Переключатель"
                hint="Источник переключателя выбирается отдельно от устройства выше — например, карточка показывает Zigbee-датчик, а переключатель управляет Modbus-реле."
              />
              <Field label="Источник переключателя">
                <SourceSwitch value={(config.toggleSource as WidgetCommandSource) ?? 'zigbee'} onChange={v => patch({ toggleSource: v })} />
              </Field>
              {((config.toggleSource as WidgetCommandSource) ?? 'zigbee') === 'zigbee' ? (
                <>
                  <Field label="Ключ состояния">
                    <PayloadKeySelect value={(config.togglePayloadKey as string) ?? ''} onChange={v => patch({ togglePayloadKey: v })} state={zigbeeState} placeholder="state" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Значение ВКЛ">
                      <Input value={(config.toggleOnValue as string) ?? 'ON'} onChange={v => patch({ toggleOnValue: v })} placeholder="ON" />
                    </Field>
                    <Field label="Значение ВЫКЛ">
                      <Input value={(config.toggleOffValue as string) ?? 'OFF'} onChange={v => patch({ toggleOffValue: v })} placeholder="OFF" />
                    </Field>
                  </div>
                </>
              ) : (
                <ModbusTargetEditor
                  modbusDeviceId={(config.toggleModbusDeviceId as string) ?? ''}
                  modbusRegisterId={(config.toggleModbusRegisterId as string) ?? ''}
                  allowedTypes={['coil']}
                  modbusDevices={modbusDevicesQ.data ?? []}
                  registers={modbusRegistersQ.data ?? []}
                  onSelectDevice={v => patch({ toggleModbusDeviceId: v, toggleModbusRegisterId: '' })}
                  onSelectRegister={v => patch({ toggleModbusRegisterId: v })}
                />
              )}
            </>
          )}
          <SectionHeader title="Оформление" />
          <Field label="Теги (до 3)"><ChipsEditor value={(config.chips as string[]) ?? []} onChange={v => patch({ chips: v })} /></Field>
          {selectedPhysicalDeviceId && (
            <Field label="Метрики (до 3)">
              <StatsEditor value={(config.stats as StatEntry[]) ?? []} onChange={v => patch({ stats: v })} state={zigbeeState} />
              <p className="text-[10px] text-slate-400">Необязательно: до 3 маленьких чисел внизу карточки — например, яркость или заряд батареи устройства, выбранного в самом начале. Если они не нужны, просто не добавляйте ни одной.</p>
            </Field>
          )}
          <Field label="Цвет">
            <Select value={(config.accent as string) ?? 'green'} onChange={v => patch({ accent: v })} options={[...ACCENT_OPTIONS, { value: 'slate', label: 'Серый (нейтральный)' }]} />
          </Field>
        </>
      )
    }

    if (type === 'DEVICE_GROUP') {
      return (
        <>
          <Field label="Заголовок"><Input value={(config.title as string) ?? ''} onChange={v => patch({ title: v })} placeholder="Группа устройств" /></Field>
          <Field label="Иконка">
            <Select value={(config.icon as string) ?? 'lightbulb'} onChange={v => patch({ icon: v })} options={[
              { value: 'camera', label: 'Камера' }, { value: 'lightbulb', label: 'Лампочка' },
              { value: 'fan', label: 'Вентилятор' }, { value: 'lock', label: 'Замок' },
              { value: 'speaker', label: 'Колонка' }, { value: 'sparkles', label: 'Уборка/освежитель' },
              { value: 'thermometer', label: 'Термометр' }, { value: 'broom', label: 'Метла (пылесос)' },
            ]} />
          </Field>
          <Field label="">
            <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={config.showGroupToggle !== false} onChange={e => patch({ showGroupToggle: e.target.checked })} className="rounded" />
              Показывать общий переключатель «всё сразу»
            </label>
          </Field>
          <SectionHeader title="Устройства" hint="Каждое устройство переключается отдельно; общий переключатель выше управляет всеми сразу." />
          <GroupItemsEditor
            items={groupItems}
            onChange={v => patch({ items: v })}
            deviceOptions={deviceOptions}
            devices={devices}
            modbusDevices={modbusDevicesQ.data ?? []}
            registersByDeviceId={groupRegistersByDeviceId}
          />
          <Field label="Цвет">
            <Select value={(config.accent as string) ?? 'green'} onChange={v => patch({ accent: v })} options={[...ACCENT_OPTIONS, { value: 'slate', label: 'Серый (нейтральный)' }]} />
          </Field>
        </>
      )
    }

    if (type === 'MINI_LINE_CHART') {
      return (
        <>
          <Field label="Устройство"><Select value={selectedPhysicalDeviceId} onChange={v => patch({ physicalDeviceId: v })} options={deviceOptions} /></Field>
          <Field label="Ключ payload"><PayloadKeySelect value={(config.payloadKey as string) ?? ''} onChange={v => patch({ payloadKey: v })} state={zigbeeState} placeholder="energy" /></Field>
          <Field label="Заголовок"><Input value={(config.title as string) ?? ''} onChange={v => patch({ title: v })} placeholder="Потребление" /></Field>
          <Field label="Единица"><Input value={(config.unit as string) ?? ''} onChange={v => patch({ unit: v })} placeholder="кВт·ч" /></Field>
          <Field label="Размер буфера"><NumberInput value={config.bufferSize as number | undefined} onChange={v => patch({ bufferSize: v })} placeholder="60" /></Field>
          <Field label="Цвет"><Select value={(config.accent as string) ?? 'green'} onChange={v => patch({ accent: v })} options={ACCENT_OPTIONS} /></Field>
        </>
      )
    }

    if (type === 'MODBUS_REGISTER_VALUE') {
      return (
        <>
          <Field label="Modbus устройство">
            <Select value={(config.modbusDeviceId as string) ?? ''} onChange={v => patch({ modbusDeviceId: v, modbusRegisterId: '' })} options={modbusDeviceOptions} />
          </Field>
          <Field label="Регистр">
            <Select value={(config.modbusRegisterId as string) ?? ''} onChange={v => patch({ modbusRegisterId: v })} options={modbusRegisterOptions} />
          </Field>
          <Field label="Подпись"><Input value={(config.label as string) ?? ''} onChange={v => patch({ label: v })} /></Field>
          <Field label="Единица"><Input value={(config.unit as string) ?? ''} onChange={v => patch({ unit: v })} /></Field>
          <Field label="Интервал обновления (сек)"><NumberInput value={config.refreshInterval as number | undefined} onChange={v => patch({ refreshInterval: v ?? 30 })} placeholder="30" /></Field>
          <Field label="Цвет акцента"><Select value={(config.accent as string) ?? 'green'} onChange={v => patch({ accent: v })} options={ACCENT_OPTIONS} /></Field>
        </>
      )
    }

    if (type === 'MODBUS_REGISTER_CONTROL') {
      return (
        <>
          <Field label="Modbus устройство">
            <Select value={(config.modbusDeviceId as string) ?? ''} onChange={v => patch({ modbusDeviceId: v, modbusRegisterId: '' })} options={modbusDeviceOptions} />
          </Field>
          <Field label="Регистр">
            <Select value={(config.modbusRegisterId as string) ?? ''} onChange={v => patch({ modbusRegisterId: v })} options={modbusRegisterOptions} />
          </Field>
          <Field label="Подпись"><Input value={(config.label as string) ?? ''} onChange={v => patch({ label: v })} /></Field>
          <Field label="Тип управления">
            <Select value={(config.controlType as string) ?? 'coil'} onChange={v => patch({ controlType: v })} options={[{ value: 'coil', label: 'Coil (переключатель)' }, { value: 'holding', label: 'Holding (числовой ввод)' }]} />
          </Field>
          <Field label="Цвет">
            <Select value={(config.accent as string) ?? 'green'} onChange={v => patch({ accent: v })} options={[{ value: 'green', label: 'Зелёный' }, { value: 'blue', label: 'Синий' }, { value: 'amber', label: 'Жёлтый' }]} />
          </Field>
        </>
      )
    }

    return <p className="text-sm text-slate-500 dark:text-slate-400">Нет настроек для этого типа виджета.</p>
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="h-full w-full max-w-sm bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Настройки виджета</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {renderFields()}
        </div>
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            Отмена
          </button>
          <button
            onClick={() => { if (config) onSave({ ...widget!, config }); onClose() }}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}
