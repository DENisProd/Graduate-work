import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow, parseISO, differenceInMinutes } from 'date-fns'
import type { Locale } from 'date-fns/locale'
import { useI18n } from '@/hooks/useI18n'
import { CloudOff, AlertTriangle, RefreshCw, CloudDownload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getSyncStatus, triggerSync } from '@/api/system'
import { buildSyncToastMessage } from '@/lib/sync-toast'

function relativeTime(iso: string | null, neverLabel: string, locale: Locale) {
  if (!iso) return neverLabel
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale })
  } catch {
    return iso
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  try {
    return parseISO(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function SyncStatusPanel() {
  const { t, dateLocale } = useI18n()
  const queryClient = useQueryClient()
  const [isSyncing, setIsSyncing] = useState(false)

  const { data, isPending, isError, dataUpdatedAt } = useQuery({
    queryKey: ['sync-status'],
    queryFn: getSyncStatus,
    refetchInterval: 60_000,
  })

  const handleSyncNow = async () => {
    setIsSyncing(true)
    try {
      const report = await triggerSync()
      toast.success(buildSyncToastMessage(report, t))
      void queryClient.invalidateQueries({ queryKey: ['sync-status'] })
      void queryClient.invalidateQueries({ queryKey: ['houses'] })
      void queryClient.invalidateQueries({ queryKey: ['rooms'] })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(t('syncPanel.toastFailed', { message: msg }))
    } finally {
      setIsSyncing(false)
    }
  }

  const syncDelayed =
    data?.lastPulledAt != null &&
    differenceInMinutes(new Date(), parseISO(data.lastPulledAt)) > 10

  const highBacklog = (data?.pendingOutbox ?? 0) > 10

  return (
    <div className="space-y-3">
      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <CloudOff className="h-3.5 w-3.5 shrink-0" />
          {t('syncPanel.fetchError')}
        </div>
      )}

      {syncDelayed && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {t('syncPanel.syncDelayed')}
        </div>
      )}

      {highBacklog && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {t('syncPanel.backlog', { count: data?.pendingOutbox ?? 0 })}
        </div>
      )}

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {[
          {
            label: t('syncPanel.lastPull'),
            value: formatDateTime(data?.lastPulledAt ?? null),
            relative: relativeTime(data?.lastPulledAt ?? null, t('common.never'), dateLocale),
          },
          {
            label: t('syncPanel.lastPush'),
            value: formatDateTime(data?.lastPushedAt ?? null),
            relative: relativeTime(data?.lastPushedAt ?? null, t('common.never'), dateLocale),
          },
        ].map(({ label, value, relative }) => (
          <div key={label} className="flex items-center justify-between py-2.5">
            <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
            {isPending ? (
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            ) : value === '—' ? (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <CloudOff className="h-3.5 w-3.5" /> {t('syncPanel.neverSynced')}
              </span>
            ) : (
              <div className="text-right">
                <span className="text-sm text-slate-800 dark:text-slate-200">{relative}</span>
                <span className="ml-2 text-xs text-slate-400">{value}</span>
              </div>
            )}
          </div>
        ))}

        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm text-slate-500 dark:text-slate-400">{t('syncPanel.pendingSync')}</span>
          {isPending ? (
            <div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  (data?.pendingOutbox ?? 0) === 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : highBacklog
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                )}
              >
                {t('common.items', { count: data?.pendingOutbox ?? 0 })}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => void handleSyncNow()}
          disabled={isSyncing}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100',
            'dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40',
            'disabled:opacity-50',
          )}
        >
          {isSyncing ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <CloudDownload className="h-3 w-3" />
          )}
          {isSyncing ? t('syncPanel.syncing') : t('syncPanel.syncNow')}
        </button>

        {dataUpdatedAt > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <RefreshCw className="h-3 w-3" />
            {relativeTime(new Date(dataUpdatedAt).toISOString(), t('common.never'), dateLocale)}
          </div>
        )}
      </div>
    </div>
  )
}
