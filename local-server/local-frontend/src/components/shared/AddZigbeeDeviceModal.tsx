import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { PAIRING_DURATION, usePairing, type PairingDevice } from '@/hooks/usePairing'
import { listDeviceCategories } from '@/api/devices'
import { updatePhysicalDevice } from '@/api/physical-devices'

function pad2(n: number) {
  return String(Math.floor(n)).padStart(2, '0')
}

function formatTime(s: number) {
  return `${pad2(s / 60)}:${pad2(s % 60)}`
}

function StatusIcon({ status }: { status: PairingDevice['status'] }) {
  if (status === 'joining' || status === 'interviewing') {
    return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
  }
  if (status === 'done') {
    return (
      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  return (
    <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

interface AddZigbeeDeviceModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddZigbeeDeviceModal({ open, onClose, onSuccess }: AddZigbeeDeviceModalProps) {
  const { t } = useI18n()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [startError, setStartError] = useState<string | null>(null)
  const addedIeees = useRef(new Set<string>())
  const [existingIeee, setExistingIeee] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<PairingDevice | null>(null)
  const [deviceName, setDeviceName] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { isActive, isSocketConnected, timeLeft, devices, start, stop, clearDevices, loadExistingIeee } =
    usePairing({ enabled: open })

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void loadExistingIeee().then((ieee) => {
      if (!cancelled) setExistingIeee(ieee)
    })
    return () => {
      cancelled = true
    }
  }, [open, loadExistingIeee])

  useEffect(() => {
    if (!open) {
      if (isActive) void stop()
      clearDevices()
      addedIeees.current.clear()
      setExistingIeee(new Set())
    }
  }, [open, isActive, stop, clearDevices])

  useEffect(() => {
    if (!open) return
    setStep(1)
    setSelected(null)
    setDeviceName('')
    setCategoryId(null)
    setCategories([])
    setCategoriesError(null)
    setSaving(false)
    setSaveError(null)
    setStartError(null)
  }, [open])

  const handleClose = () => {
    if (isActive) void stop()
    clearDevices()
    addedIeees.current.clear()
    onClose()
  }

  const handleStart = async () => {
    setStartError(null)
    const result = await start(PAIRING_DURATION)
    if (!result.ok) setStartError(result.error ?? t('pairing.startError'))
  }

  const progressPct = isActive ? (timeLeft / PAIRING_DURATION) * 100 : 0

  const visibleDevices = useMemo(() => {
    return devices.filter((d) => {
      if (addedIeees.current.has(d.ieeeAddr)) return false
      if (existingIeee.has(d.ieeeAddr)) return false
      return true
    })
  }, [devices, existingIeee])

  const canSelect = (d: PairingDevice) => d.status === 'done' && Boolean(d.physicalDeviceId)

  const handleSelect = async (d: PairingDevice) => {
    setSelected(d)
    const fallback =
      (d.friendlyName && !d.friendlyName.startsWith('0x') ? d.friendlyName : '') ||
      d.model ||
      (d.manufacturer && d.model ? `${d.manufacturer} ${d.model}` : '') ||
      t('pairing.newDeviceFallback')
    setDeviceName(fallback)
    setStep(2)

    try {
      setCategoriesError(null)
      const all = await listDeviceCategories()
      setCategories(all.map((c) => ({ id: c.id, name: c.code })))
    } catch {
      setCategoriesError(t('pairing.categoriesError'))
    }
  }

  const handleSave = async () => {
    if (!selected?.physicalDeviceId) return
    setSaving(true)
    setSaveError(null)
    try {
      const name = deviceName.trim()
      if (!name) {
        setSaveError(t('pairing.nameRequired'))
        return
      }
      await updatePhysicalDevice(selected.physicalDeviceId, {
        name,
        ...(categoryId ? { deviceCategoryId: categoryId } : {}),
      })
      addedIeees.current.add(selected.ieeeAddr)
      setExistingIeee((prev) => new Set(prev).add(selected.ieeeAddr))
      onSuccess?.()
      toast.success(t('pairing.addedSuccess'))
      setStep(3)
    } catch {
      setSaveError(t('pairing.addError'))
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">{t('pairing.title')}</h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {step === 1
                  ? t('pairing.stepPairing')
                  : step === 2
                    ? t('pairing.stepConfigure')
                    : t('pairing.stepDone')}
              </span>
              {step !== 1 && (
                <button
                  onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : 1))}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  {t('common.back')}
                </button>
              )}
            </div>

            {!isSocketConnected && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
                {t('pairing.noSocket')}
              </div>
            )}

            {step === 1 && !isActive && visibleDevices.length === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('pairing.description')}</p>
                {startError && <p className="text-xs text-red-600 dark:text-red-400">{startError}</p>}
                <button
                  onClick={() => void handleStart()}
                  disabled={!isSocketConnected}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {t('pairing.start')}
                </button>
              </div>
            )}

            {step === 1 && isActive && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {t('pairing.searching')}
                    </span>
                    <span className="font-mono tabular-nums">{formatTime(timeLeft)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-1000"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => void stop()}
                  className="w-full rounded-lg border border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  {t('pairing.stop')}
                </button>
              </div>
            )}

            {step === 1 && visibleDevices.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {t('pairing.found', { count: visibleDevices.length })}
                </p>
                <div className="space-y-2">
                  {visibleDevices.map((device) => (
                    <div
                      key={device.ieeeAddr}
                      className={cn(
                        'rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900',
                        device.status === 'failed' && 'border-red-300/50 opacity-60',
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          <StatusIcon status={device.status} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                            {device.model ?? device.friendlyName}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {device.manufacturer ? `${device.manufacturer} · ` : ''}
                            {device.ieeeAddr}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <button
                          disabled={!canSelect(device)}
                          onClick={() => void handleSelect(device)}
                          className="w-full rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {t('pairing.configure')}
                        </button>
                        {device.status === 'failed' && (
                          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                            {t('pairing.interviewFailed')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && isActive && devices.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <p className="text-xs text-slate-500">{t('pairing.waitingForDevices')}</p>
              </div>
            )}

            {step === 2 && selected && (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {selected.model ?? selected.friendlyName}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {selected.manufacturer ? `${selected.manufacturer} · ` : ''}
                    {selected.ieeeAddr}
                  </p>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t('pairing.nameLabel')}
                  </span>
                  <input
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder={t('pairing.namePlaceholder')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t('pairing.categoryLabel')}
                  </span>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={categoryId ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      setCategoryId(v ? Number(v) : null)
                    }}
                  >
                    <option value="">{t('pairing.categoryNone')}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {categoriesError && (
                    <p className="text-[11px] text-red-600 dark:text-red-400">{categoriesError}</p>
                  )}
                </label>

                {saveError && <p className="text-[11px] text-red-600 dark:text-red-400">{saveError}</p>}

                <button
                  onClick={() => void handleSave()}
                  disabled={saving || !selected.physicalDeviceId}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? t('pairing.saving') : t('pairing.addDevice')}
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                  {t('pairing.doneHint')}
                </p>
                <button
                  onClick={handleClose}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {t('common.done')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
