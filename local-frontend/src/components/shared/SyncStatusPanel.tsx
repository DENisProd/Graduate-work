import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow, parseISO, differenceInMinutes } from 'date-fns'
import { CloudOff, AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSyncStatus } from '@/api/system'

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true })
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
  const { data, isPending, isError, dataUpdatedAt } = useQuery({
    queryKey: ['sync-status'],
    queryFn: getSyncStatus,
    refetchInterval: 60_000,
  })

  const syncDelayed =
    data?.lastPulledAt != null &&
    differenceInMinutes(new Date(), parseISO(data.lastPulledAt)) > 10

  const highBacklog = (data?.pendingOutbox ?? 0) > 10

  return (
    <div className="space-y-3">
      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <CloudOff className="h-3.5 w-3.5 shrink-0" />
          Failed to fetch sync status
        </div>
      )}

      {syncDelayed && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Sync delayed — last pull was more than 10 minutes ago
        </div>
      )}

      {highBacklog && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Large sync backlog — {data?.pendingOutbox} items pending
        </div>
      )}

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {[
          {
            label: 'Last Pull',
            value: formatDateTime(data?.lastPulledAt ?? null),
            relative: relativeTime(data?.lastPulledAt ?? null),
          },
          {
            label: 'Last Push',
            value: formatDateTime(data?.lastPushedAt ?? null),
            relative: relativeTime(data?.lastPushedAt ?? null),
          },
        ].map(({ label, value, relative }) => (
          <div key={label} className="flex items-center justify-between py-2.5">
            <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
            {isPending ? (
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            ) : value === '—' ? (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <CloudOff className="h-3.5 w-3.5" /> Never synced
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
          <span className="text-sm text-slate-500 dark:text-slate-400">Pending Sync</span>
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
                {data?.pendingOutbox ?? 0} items
              </span>
            </div>
          )}
        </div>
      </div>

      {dataUpdatedAt > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <RefreshCw className="h-3 w-3" />
          Auto-refreshes every 60s · last updated {relativeTime(new Date(dataUpdatedAt).toISOString())}
        </div>
      )}
    </div>
  )
}
