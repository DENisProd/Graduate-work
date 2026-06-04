import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { RegistersPanel } from '@/pages/ModbusPage'
import type { ModbusDevice } from '@/types'

interface Props {
  device: ModbusDevice | null
  open: boolean
  onClose: () => void
}

export function ModbusDeviceDrawer({ device, open, onClose }: Props) {
  const { t, dateLocale } = useI18n()

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      )}

      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-950 md:w-[640px]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {device && (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">{device.name}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Modbus · slave {device.slaveId}
                  {device.description && ` · ${device.description}`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <RegistersPanel device={device} t={t} dateLocale={dateLocale} />
            </div>
          </>
        )}
      </div>
    </>
  )
}
