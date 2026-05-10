import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, Code, Sliders } from 'lucide-react'
import { cn } from '@/lib/utils'
import { listPhysicalDevices } from '@/api/physical-devices'
import type { ScenarioDefinition, ScenarioTrigger, ScenarioAction } from '@/types'

type LocalAction = {
  type: ScenarioAction['type']
  deviceId: string
  payloadStr: string
  message: string
}

const EMPTY_TRIGGER: ScenarioTrigger = { type: 'manual' }
const EMPTY_ACTION: LocalAction = { type: 'log_message', deviceId: '', payloadStr: '', message: '' }

function toLocal(a: ScenarioAction): LocalAction {
  return {
    type: a.type,
    deviceId: a.deviceId ?? '',
    payloadStr: a.payload ? JSON.stringify(a.payload, null, 2) : '',
    message: a.message ?? '',
  }
}

function fromLocal(a: LocalAction): ScenarioAction {
  const action: ScenarioAction = { type: a.type }
  if (a.type === 'zigbee_command') {
    if (a.deviceId) action.deviceId = a.deviceId
    try { action.payload = JSON.parse(a.payloadStr) } catch { action.payload = {} }
  } else {
    if (a.message) action.message = a.message
  }
  return action
}

interface Props {
  value: ScenarioDefinition
  onChange: (def: ScenarioDefinition) => void
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {children}
    </p>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs text-slate-500 dark:text-slate-400">{children}</label>
  )
}

function Select({
  value,
  onChange,
  children,
  className,
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(
        'h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
        className,
      )}
    >
      {children}
    </select>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
        props.className,
      )}
    />
  )
}

export function ScenarioDefinitionEditor({ value, onChange }: Props) {
  const [mode, setMode] = useState<'simple' | 'raw'>('simple')
  const [rawJson, setRawJson] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [triggers, setTriggers] = useState<ScenarioTrigger[]>(value.triggers)
  const [localActions, setLocalActions] = useState<LocalAction[]>(
    value.actions.map(toLocal),
  )

  const { data: devicesPage } = useQuery({
    queryKey: ['physical-devices-editor'],
    queryFn: () => listPhysicalDevices({ size: 100 }),
  })
  const devices = devicesPage?.content ?? []

  const buildDef = useCallback(
    (t: ScenarioTrigger[], a: LocalAction[]): ScenarioDefinition => ({
      triggers: t,
      actions: a.map(fromLocal),
    }),
    [],
  )

  // Propagate simple-mode changes to parent
  useEffect(() => {
    if (mode === 'simple') onChange(buildDef(triggers, localActions))
  }, [triggers, localActions, mode, onChange, buildDef])

  // ── Mode switching ────────────────────────────────────────────────
  const switchToRaw = () => {
    setRawJson(JSON.stringify(buildDef(triggers, localActions), null, 2))
    setJsonError('')
    setMode('raw')
  }

  const switchToSimple = () => {
    try {
      const parsed = JSON.parse(rawJson) as ScenarioDefinition
      setTriggers(parsed.triggers ?? [])
      setLocalActions((parsed.actions ?? []).map(toLocal))
      setJsonError('')
      setMode('simple')
      onChange(parsed)
    } catch {
      setJsonError('Fix JSON errors before switching')
    }
  }

  const handleRawChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const str = e.target.value
    setRawJson(str)
    try {
      const parsed = JSON.parse(str) as ScenarioDefinition
      setJsonError('')
      onChange(parsed)
    } catch {
      setJsonError('Invalid JSON')
    }
  }

  // ── Trigger helpers ───────────────────────────────────────────────
  const updateTrigger = (i: number, patch: Partial<ScenarioTrigger>) => {
    setTriggers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)))
  }
  const addTrigger = () => setTriggers((prev) => [...prev, { ...EMPTY_TRIGGER }])
  const removeTrigger = (i: number) => setTriggers((prev) => prev.filter((_, idx) => idx !== i))

  // ── Action helpers ────────────────────────────────────────────────
  const updateAction = (i: number, patch: Partial<LocalAction>) => {
    setLocalActions((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)))
  }
  const addAction = () => setLocalActions((prev) => [...prev, { ...EMPTY_ACTION }])
  const removeAction = (i: number) =>
    setLocalActions((prev) => prev.filter((_, idx) => idx !== i))

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Definition</p>
        <button
          type="button"
          onClick={mode === 'simple' ? switchToRaw : switchToSimple}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {mode === 'simple' ? (
            <><Code className="h-3.5 w-3.5" /> Raw JSON</>
          ) : (
            <><Sliders className="h-3.5 w-3.5" /> Simple</>
          )}
        </button>
      </div>

      {mode === 'raw' ? (
        <div className="space-y-1.5">
          <textarea
            value={rawJson}
            onChange={handleRawChange}
            rows={14}
            className="w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {jsonError && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">{jsonError}</p>
          )}
        </div>
      ) : (
        <>
          {/* ── Triggers ──────────────────────────────── */}
          <div className="space-y-3">
            <SectionHeader>Triggers</SectionHeader>

            {triggers.length === 0 && (
              <p className="text-xs text-slate-400">No triggers — scenario can only be run manually.</p>
            )}

            {triggers.map((trigger, i) => (
              <div
                key={i}
                className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <Select
                    value={trigger.type}
                    onChange={(e) =>
                      updateTrigger(i, { type: e.target.value as ScenarioTrigger['type'] })
                    }
                  >
                    <option value="manual">Manual</option>
                    <option value="device_state">Device state change</option>
                    <option value="schedule">Schedule (cron)</option>
                  </Select>
                  <button
                    type="button"
                    onClick={() => removeTrigger(i)}
                    className="ml-auto rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {trigger.type === 'device_state' && (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1">
                      <FieldLabel>Device</FieldLabel>
                      <Select
                        value={trigger.deviceId ?? ''}
                        onChange={(e) => updateTrigger(i, { deviceId: e.target.value })}
                        className="w-full"
                      >
                        <option value="">— select device —</option>
                        {devices.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.friendlyName ?? d.name} ({d.protocolAddress})
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <FieldLabel>Condition (e.g. state === "ON")</FieldLabel>
                      <Input
                        value={trigger.condition ?? ''}
                        onChange={(e) => updateTrigger(i, { condition: e.target.value })}
                        placeholder='state === "ON"'
                      />
                    </div>
                  </div>
                )}

                {trigger.type === 'schedule' && (
                  <div className="flex flex-col gap-1">
                    <FieldLabel>Cron expression</FieldLabel>
                    <Input
                      value={trigger.cron ?? ''}
                      onChange={(e) => updateTrigger(i, { cron: e.target.value })}
                      placeholder="0 8 * * *"
                      className="font-mono"
                    />
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addTrigger}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Plus className="h-3.5 w-3.5" /> Add Trigger
            </button>
          </div>

          {/* ── Actions ───────────────────────────────── */}
          <div className="space-y-3">
            <SectionHeader>Actions</SectionHeader>

            {localActions.length === 0 && (
              <p className="text-xs text-slate-400">No actions defined.</p>
            )}

            {localActions.map((action, i) => (
              <div
                key={i}
                className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <Select
                    value={action.type}
                    onChange={(e) =>
                      updateAction(i, { type: e.target.value as ScenarioAction['type'] })
                    }
                  >
                    <option value="log_message">Log message</option>
                    <option value="zigbee_command">Send Zigbee command</option>
                  </Select>
                  <button
                    type="button"
                    onClick={() => removeAction(i)}
                    className="ml-auto rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {action.type === 'log_message' && (
                  <div className="flex flex-col gap-1">
                    <FieldLabel>Message</FieldLabel>
                    <Input
                      value={action.message}
                      onChange={(e) => updateAction(i, { message: e.target.value })}
                      placeholder="Scenario executed"
                    />
                  </div>
                )}

                {action.type === 'zigbee_command' && (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1">
                      <FieldLabel>Device</FieldLabel>
                      <Select
                        value={action.deviceId}
                        onChange={(e) => updateAction(i, { deviceId: e.target.value })}
                        className="w-full"
                      >
                        <option value="">— select device —</option>
                        {devices.map((d) => (
                          <option key={d.id} value={d.protocolAddress}>
                            {d.friendlyName ?? d.name} ({d.protocolAddress})
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <FieldLabel>Payload JSON</FieldLabel>
                      <textarea
                        value={action.payloadStr}
                        onChange={(e) => updateAction(i, { payloadStr: e.target.value })}
                        rows={3}
                        placeholder={'{ "state": "ON" }'}
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addAction}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Plus className="h-3.5 w-3.5" /> Add Action
            </button>
          </div>
        </>
      )}
    </div>
  )
}
