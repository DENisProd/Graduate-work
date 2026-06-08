import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createModbusDevice } from '@/api/modbus'

export function AddModbusDeviceModal({
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
