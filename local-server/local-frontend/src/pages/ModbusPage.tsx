import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow, parseISO } from 'date-fns'
import type { Locale } from 'date-fns/locale'
import {
  Plus,
  Trash2,
  RefreshCw,
  PencilLine,
  ClipboardList,
  Radio,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import type { ModbusDevice, ModbusRegister, ModbusRegisterState, ScanLogEntry } from '@/types'
import {
  createModbusDevice,
  listModbusRegisters,
  createModbusRegister,
  deleteModbusRegister,
  readModbusRegister,
  writeModbusRegister,
  getDeviceState,
  getScanLog,
  triggerScan,
} from '@/api/modbus'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTs(ts: string | undefined, locale: Locale) {
  if (!ts) return '—'
  try {
    return formatDistanceToNow(parseISO(ts), { addSuffix: true, locale })
  } catch {
    return ts
  }
}

function RegisterTypeBadge({ type }: { type: ModbusRegister['registerType'] }) {
  const cls =
    type === 'holding'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : type === 'input'
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : type === 'coil'
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  return <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', cls)}>{type}</span>
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  body,
  onConfirm,
  onCancel,
  t,
}: {
  title: string
  body: string
  onConfirm: () => void
  onCancel: () => void
  t: (key: string, vars?: Record<string, string | number | undefined>) => string
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{body}</p>
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

// ─── Add Device Modal ─────────────────────────────────────────────────────────

export function AddDeviceModal({
  onClose,
  onSuccess,
  t,
}: {
  onClose: () => void
  onSuccess: () => void
  t: (key: string, vars?: Record<string, string | number | undefined>) => string
}) {
  const [name, setName] = useState('')
  const [slaveId, setSlaveId] = useState('1')
  const [description, setDescription] = useState('')
  const [enabled, setEnabled] = useState(true)

  const mutation = useMutation({
    mutationFn: () =>
      createModbusDevice({
        name: name.trim(),
        slaveId: Number(slaveId),
        description: description.trim() || undefined,
        enabled,
      }),
    onSuccess: () => {
      toast.success(t('modbus.toastDeviceCreated'))
      onSuccess()
      onClose()
    },
    onError: () => toast.error(t('modbus.toastDeviceCreateFailed')),
  })

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-96 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('modbus.addDevice')}</h3>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.formName')}</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Temperature Sensor"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.formSlaveId')}</span>
            <input
              type="number"
              min={1}
              max={247}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={slaveId}
              onChange={(e) => setSlaveId(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.formDescription')}</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Room 1 sensor"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded"
            />
            {t('modbus.formEnabled')}
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {mutation.isPending ? '…' : t('common.add')}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Add Register Modal ───────────────────────────────────────────────────────

const REGISTER_TYPES = ['holding', 'input', 'coil', 'discrete'] as const

function AddRegisterModal({
  deviceId,
  onClose,
  onSuccess,
  t,
}: {
  deviceId: string
  onClose: () => void
  onSuccess: () => void
  t: (key: string, vars?: Record<string, string | number | undefined>) => string
}) {
  const [name, setName] = useState('')
  const [regType, setRegType] = useState<(typeof REGISTER_TYPES)[number]>('holding')
  const [address, setAddress] = useState('0')
  const [count, setCount] = useState('1')
  const [unit, setUnit] = useState('')
  const [scaleFactor, setScaleFactor] = useState('1')
  const [offset, setOffset] = useState('0')
  const [writable, setWritable] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      createModbusRegister(deviceId, {
        name: name.trim(),
        registerType: regType,
        address: Number(address),
        count: Number(count),
        unit: unit.trim() || undefined,
        scaleFactor: Number(scaleFactor),
        offset: Number(offset),
        writable,
      }),
    onSuccess: () => {
      toast.success(t('modbus.toastRegisterCreated'))
      onSuccess()
      onClose()
    },
    onError: () => toast.error(t('modbus.toastRegisterCreateFailed')),
  })

  const regTypeLabel: Record<(typeof REGISTER_TYPES)[number], string> = {
    holding: t('modbus.regTypeHolding'),
    input: t('modbus.regTypeInput'),
    coil: t('modbus.regTypeCoil'),
    discrete: t('modbus.regTypeDiscrete'),
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('modbus.addRegister')}</h3>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.formName')}</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Temperature"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.formRegType')}</span>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={regType}
              onChange={(e) => setRegType(e.target.value as (typeof REGISTER_TYPES)[number])}
            >
              {REGISTER_TYPES.map((rt) => (
                <option key={rt} value={rt}>{regTypeLabel[rt]}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.formAddress')}</span>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.formCount')}</span>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.formUnit')}</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="°C"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.formScaleFactor')}</span>
              <input
                type="number"
                step="any"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={scaleFactor}
                onChange={(e) => setScaleFactor(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.formOffset')}</span>
              <input
                type="number"
                step="any"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={offset}
                onChange={(e) => setOffset(e.target.value)}
              />
            </label>
          </div>
          {(regType === 'holding' || regType === 'coil') && (
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={writable}
                onChange={(e) => setWritable(e.target.checked)}
                className="rounded"
              />
              {t('modbus.formWritable')}
            </label>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {mutation.isPending ? '…' : t('common.add')}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Write Register Modal ─────────────────────────────────────────────────────

function WriteRegisterModal({
  deviceId,
  register,
  onClose,
  t,
}: {
  deviceId: string
  register: ModbusRegister
  onClose: () => void
  t: (key: string, vars?: Record<string, string | number | undefined>) => string
}) {
  const [value, setValue] = useState('')
  const [coil, setCoil] = useState(true)

  const mutation = useMutation({
    mutationFn: () => {
      if (register.registerType === 'coil') {
        return writeModbusRegister(deviceId, register.id, { coil })
      }
      const trimmed = value.trim()
      if (trimmed.includes(',')) {
        const values = trimmed.split(',').map((v) => Number(v.trim()))
        return writeModbusRegister(deviceId, register.id, { values })
      }
      return writeModbusRegister(deviceId, register.id, { value: Number(trimmed) })
    },
    onSuccess: () => {
      toast.success(t('modbus.toastWriteOk'))
      onClose()
    },
    onError: () => toast.error(t('modbus.toastWriteFailed')),
  })

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('modbus.writeTitle')}</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {register.name} — addr {register.address}
        </p>
        <div className="mt-4">
          {register.registerType === 'coil' ? (
            <div className="flex gap-2">
              <button
                onClick={() => setCoil(true)}
                className={cn(
                  'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
                  coil
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800',
                )}
              >
                {t('modbus.writeOn')}
              </button>
              <button
                onClick={() => setCoil(false)}
                className={cn(
                  'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
                  !coil
                    ? 'bg-red-600 text-white'
                    : 'border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800',
                )}
              >
                {t('modbus.writeOff')}
              </button>
            </div>
          ) : (
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {register.count > 1 ? t('modbus.writeValues') : t('modbus.writeValue')}
              </span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={register.count > 1 ? '1000, 2000' : '1000'}
              />
            </label>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || (register.registerType !== 'coil' && !value.trim())}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {mutation.isPending ? '…' : t('modbus.write')}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Registers panel ──────────────────────────────────────────────────────────

export function RegistersPanel({
  device,
  t,
  dateLocale,
}: {
  device: ModbusDevice
  t: (key: string, vars?: Record<string, string | number | undefined>) => string
  dateLocale: Locale
}) {
  const queryClient = useQueryClient()
  const [showAddRegister, setShowAddRegister] = useState(false)
  const [pendingDeleteReg, setPendingDeleteReg] = useState<ModbusRegister | null>(null)
  const [writingReg, setWritingReg] = useState<ModbusRegister | null>(null)
  const [readingId, setReadingId] = useState<string | null>(null)

  const { data: registers = [], isPending: regsPending } = useQuery({
    queryKey: ['modbus-registers', device.id],
    queryFn: () => listModbusRegisters(device.id),
  })

  const { data: states = [] } = useQuery({
    queryKey: ['modbus-device-state', device.id],
    queryFn: () => getDeviceState(device.id),
    refetchInterval: 10_000,
  })

  const stateMap = useMemo(
    () => new Map<string, ModbusRegisterState>(states.map((s) => [s.registerId, s])),
    [states],
  )

  const deleteRegMutation = useMutation({
    mutationFn: (reg: ModbusRegister) => deleteModbusRegister(device.id, reg.id),
    onSuccess: () => {
      toast.success(t('modbus.toastRegisterDeleted'))
      setPendingDeleteReg(null)
      queryClient.invalidateQueries({ queryKey: ['modbus-registers', device.id] })
      queryClient.invalidateQueries({ queryKey: ['modbus-device-state', device.id] })
    },
    onError: () => toast.error(t('modbus.toastRegisterDeleteFailed')),
  })

  const readMutation = useMutation({
    mutationFn: (reg: ModbusRegister) => readModbusRegister(device.id, reg.id),
    onMutate: (reg) => setReadingId(reg.id),
    onSettled: () => setReadingId(null),
    onSuccess: (result) => {
      toast.success(
        `${t('modbus.toastReadOk')}: ${result.scaledValues.join(', ')}`,
      )
      queryClient.invalidateQueries({ queryKey: ['modbus-device-state', device.id] })
    },
    onError: () => toast.error(t('modbus.toastReadFailed')),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {device.name}
          <span className="ml-2 text-xs font-normal text-slate-400">slave {device.slaveId}</span>
        </h2>
        <button
          onClick={() => setShowAddRegister(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('modbus.addRegister')}
        </button>
      </div>

      {regsPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : registers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="mb-2 h-8 w-8 text-slate-400 dark:text-slate-600" />
          <p className="font-medium text-slate-700 dark:text-slate-300">{t('modbus.emptyRegisters')}</p>
          <p className="mt-1 text-xs text-slate-400">{t('modbus.emptyRegistersHint')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.colName')}</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.colType')}</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.colAddress')}</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.colUnit')}</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.colLastValue')}</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t('modbus.colTimestamp')}</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {registers.map((reg) => {
                const state = stateMap.get(reg.id)
                const displayValue = state
                  ? state.scaledValues.map((v) => v.toFixed(2)).join(', ')
                  : '—'
                return (
                  <tr
                    key={reg.id}
                    className="bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
                  >
                    <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                      {reg.name}
                    </td>
                    <td className="px-3 py-2.5">
                      <RegisterTypeBadge type={reg.registerType} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {reg.address}
                      {reg.count > 1 && <span className="text-slate-400"> ×{reg.count}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                      {reg.unit ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {displayValue}
                      {reg.unit && state && (
                        <span className="ml-0.5 text-slate-400"> {reg.unit}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-400">
                      {formatTs(state?.timestamp, dateLocale)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => readMutation.mutate(reg)}
                          disabled={readingId === reg.id}
                          title={t('modbus.read')}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                        >
                          <RefreshCw className={cn('h-3.5 w-3.5', readingId === reg.id && 'animate-spin')} />
                        </button>
                        {reg.writable && (
                          <button
                            onClick={() => setWritingReg(reg)}
                            title={t('modbus.write')}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400"
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setPendingDeleteReg(reg)}
                          title={t('common.delete')}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddRegister && (
        <AddRegisterModal
          deviceId={device.id}
          onClose={() => setShowAddRegister(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['modbus-registers', device.id] })
          }}
          t={t}
        />
      )}

      {pendingDeleteReg && (
        <ConfirmDialog
          title={t('modbus.deleteRegisterTitle')}
          body={t('modbus.deleteRegisterBody', { name: pendingDeleteReg.name })}
          onConfirm={() => deleteRegMutation.mutate(pendingDeleteReg)}
          onCancel={() => setPendingDeleteReg(null)}
          t={t}
        />
      )}

      {writingReg && (
        <WriteRegisterModal
          deviceId={device.id}
          register={writingReg}
          onClose={() => setWritingReg(null)}
          t={t}
        />
      )}
    </div>
  )
}

// ─── Scan Log ─────────────────────────────────────────────────────────────────

function ScanLogEntryRow({
  entry,
  t,
  dateLocale,
}: {
  entry: ScanLogEntry
  t: (key: string, vars?: Record<string, string | number | undefined>) => string
  dateLocale: Locale
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span>{formatTs(entry.timestamp, dateLocale)}</span>
        <span>{t('modbus.scanFound', { count: entry.found })}</span>
        <span className="text-emerald-600 dark:text-emerald-400">
          {t('modbus.scanRegistered', { count: entry.registered })}
        </span>
      </div>
      {entry.devices.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400">
                <th className="pb-1 pr-4 text-left font-medium">{t('modbus.scanColName')}</th>
                <th className="pb-1 pr-4 text-left font-medium">{t('modbus.scanColSlaveId')}</th>
                <th className="pb-1 pr-4 text-left font-medium">{t('modbus.scanColBaud')}</th>
                <th className="pb-1 pr-4 text-left font-medium">{t('modbus.scanColRegs')}</th>
                <th className="pb-1 text-left font-medium">{t('modbus.scanColStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {entry.devices.map((dev) => {
                const regParts = [
                  dev.coils > 0 && `C:${dev.coils}`,
                  dev.discreteInputs > 0 && `DI:${dev.discreteInputs}`,
                  dev.holdingRegisters > 0 && `HR:${dev.holdingRegisters}`,
                  dev.inputRegisters > 0 && `IR:${dev.inputRegisters}`,
                ].filter(Boolean)
                return (
                  <tr key={`${dev.slaveId}-${dev.baudRate}`}>
                    <td className="py-1 pr-4 font-medium text-slate-800 dark:text-slate-200">
                      {dev.name}
                    </td>
                    <td className="py-1 pr-4 font-mono text-slate-600 dark:text-slate-400">
                      {dev.slaveId}
                    </td>
                    <td className="py-1 pr-4 font-mono text-slate-600 dark:text-slate-400">
                      {dev.baudRate}
                    </td>
                    <td className="py-1 pr-4 text-slate-500 dark:text-slate-400">
                      {regParts.length > 0 ? regParts.join(' ') : '—'}
                    </td>
                    <td className="py-1">
                      {dev.isNew ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {t('modbus.scanNew')}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ScanLogPanel({
  t,
  dateLocale,
}: {
  t: (key: string, vars?: Record<string, string | number | undefined>) => string
  dateLocale: Locale
}) {
  const queryClient = useQueryClient()

  const { data: log = [] } = useQuery({
    queryKey: ['modbus-scan-log'],
    queryFn: getScanLog,
    refetchInterval: 10_000,
  })

  const scanMutation = useMutation({
    mutationFn: triggerScan,
    onSuccess: () => {
      toast.success(t('modbus.toastScanTriggered'))
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['modbus-scan-log'] }), 8_000)
    },
    onError: () => toast.error(t('modbus.toastScanFailed')),
  })

  return (
    <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t('modbus.scanLog')}
        </h2>
        <button
          onClick={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', scanMutation.isPending && 'animate-spin')} />
          {scanMutation.isPending ? t('modbus.scanning') : t('modbus.scan')}
        </button>
      </div>

      {log.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('modbus.scanEmpty')}</p>
          <p className="mt-1 text-xs text-slate-400">{t('modbus.scanEmptyHint')}</p>
        </div>
      ) : (
        <div className="max-h-56 space-y-2 overflow-y-auto">
          {[...log].reverse().map((entry, i) => (
            <ScanLogEntryRow key={i} entry={entry} t={t} dateLocale={dateLocale} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Modbus Tab (scan log only — devices are in the unified Devices list) ─────

export function ModbusTab() {
  const { t, dateLocale } = useI18n()
  return <ScanLogPanel t={t} dateLocale={dateLocale} />
}
