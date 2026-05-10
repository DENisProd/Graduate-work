import { X, Radio, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePairing } from '@/hooks/usePairing'
import type { PairingEvent } from '@/types'

const EVENT_ICONS: Record<PairingEvent['type'], React.ReactNode> = {
  device_found: <Radio className="h-4 w-4 text-blue-500" />,
  device_joined: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  interview_started: <Loader2 className="h-4 w-4 animate-spin text-slate-400" />,
  interview_successful: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  interview_failed: <AlertCircle className="h-4 w-4 text-red-500" />,
}

interface PairingDialogProps {
  open: boolean
  onClose: () => void
}

export function PairingDialog({ open, onClose }: PairingDialogProps) {
  const { active, seconds, events, startPairing, stopPairing } = usePairing()

  const handleClose = () => {
    if (active) stopPairing()
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Add Device</h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {!active ? (
              <div className="text-center space-y-3 py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                  <Radio className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    Ready to pair
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Put your device in pairing mode, then click Start.
                  </p>
                </div>
                <button
                  onClick={() => void startPairing()}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Start Pairing
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center">
                      <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-30" />
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <Radio className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        Searching...
                      </p>
                      <p className="text-xs text-slate-500">
                        {seconds}s remaining
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={stopPairing}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Stop
                  </button>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-1000"
                    style={{ width: `${(seconds / 60) * 100}%` }}
                  />
                </div>
              </>
            )}

            {events.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Events
                </p>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  {events.map((event, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-start gap-3 p-3 text-sm',
                        i > 0 && 'border-t border-slate-100 dark:border-slate-800',
                      )}
                    >
                      <span className="mt-0.5 shrink-0">{EVENT_ICONS[event.type]}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                          {event.type.replace(/_/g, ' ')}
                        </p>
                        {(event.friendlyName ?? event.ieeeAddr) && (
                          <p className="truncate text-xs text-slate-500">
                            {event.friendlyName ?? event.ieeeAddr}
                            {event.model && ` · ${event.model}`}
                          </p>
                        )}
                        {event.message && (
                          <p className="text-xs text-slate-400">{event.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
