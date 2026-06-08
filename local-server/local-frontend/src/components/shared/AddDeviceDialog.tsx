import { useState } from 'react'
import { X, Radio, Cpu } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { AddZigbeeDeviceModal } from './AddZigbeeDeviceModal'
import { AddModbusDeviceModal } from './AddModbusDeviceModal'

type Protocol = 'choose' | 'zigbee' | 'modbus'

interface AddDeviceDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddDeviceDialog({ open, onClose, onSuccess }: AddDeviceDialogProps) {
  const { t } = useI18n()
  const [protocol, setProtocol] = useState<Protocol>('choose')

  const handleClose = () => {
    setProtocol('choose')
    onClose()
  }

  const handleSuccess = () => {
    onSuccess?.()
    setProtocol('choose')
    onClose()
  }

  if (!open) return null

  if (protocol === 'zigbee') {
    return (
      <AddZigbeeDeviceModal
        open
        onClose={() => setProtocol('choose')}
        onSuccess={() => {
          onSuccess?.()
          setProtocol('choose')
          onClose()
        }}
      />
    )
  }

  if (protocol === 'modbus') {
    return (
      <AddModbusDeviceModal
        onClose={() => setProtocol('choose')}
        onSuccess={handleSuccess}
        t={t}
      />
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              {t('addDevice.title')}
            </h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3 p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('addDevice.hint')}</p>

            <button
              onClick={() => setProtocol('zigbee')}
              className="flex w-full items-start gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left transition-colors hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <Radio className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {t('addDevice.zigbeeTitle')}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {t('addDevice.zigbeeHint')}
                </p>
              </div>
            </button>

            <button
              onClick={() => setProtocol('modbus')}
              className="flex w-full items-start gap-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-left transition-colors hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-900/20 dark:hover:bg-orange-900/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/40">
                <Cpu className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {t('addDevice.modbusTitle')}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {t('addDevice.modbusHint')}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
