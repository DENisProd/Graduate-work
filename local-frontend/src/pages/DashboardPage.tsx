import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  Tag,
  Cpu,
  Radio,
  Workflow,
  CloudOff,
  Clock,
  ArrowUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getHealth,
  getSyncStatus,
  getPhysicalDevicesCount,
  getZigbeeDevicesCount,
  getScenariosCount,
} from '@/api/system'

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-slate-200 dark:bg-slate-700',
        className,
      )}
    />
  )
}

type StatusVariant = 'ok' | 'warn' | 'error' | 'neutral'

function StatusIcon({ variant }: { variant: StatusVariant }) {
  if (variant === 'ok') return <CheckCircle className="h-5 w-5 text-emerald-500" />
  if (variant === 'warn') return <AlertCircle className="h-5 w-5 text-amber-500" />
  if (variant === 'error') return <XCircle className="h-5 w-5 text-red-500" />
  return <div className="h-5 w-5 rounded-full bg-slate-300 dark:bg-slate-600" />
}

interface StatCardProps {
  title: string
  value: React.ReactNode
  icon: React.ReactNode
  variant?: StatusVariant
  loading?: boolean
  sub?: string
}

function StatCard({ title, value, icon, variant = 'neutral', loading, sub }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="text-slate-400">{icon}</div>
      </div>
      {loading ? (
        <>
          <Skeleton className="mb-1 h-7 w-20" />
          <Skeleton className="h-4 w-16" />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <StatusIcon variant={variant} />
            <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {value}
            </span>
          </div>
          {sub && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>
          )}
        </>
      )}
    </div>
  )
}

function CountCard({
  title,
  count,
  icon,
  loading,
  error,
}: {
  title: string
  count: number | undefined
  icon: React.ReactNode
  loading: boolean
  error: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="text-slate-400">{icon}</div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {error ? '—' : (count ?? 0)}
        </span>
      )}
    </div>
  )
}

function SyncRow({
  label,
  value,
  loading,
}: {
  label: string
  value: string | null | undefined
  loading: boolean
}) {
  const formatted = value
    ? formatDistanceToNow(new Date(value), { addSuffix: true })
    : 'Never'

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      {loading ? (
        <Skeleton className="h-4 w-24" />
      ) : (
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {formatted}
        </span>
      )}
    </div>
  )
}

export function DashboardPage() {
  const health = useQuery({
    queryKey: ['system', 'health'],
    queryFn: getHealth,
    refetchInterval: 30_000,
    retry: 1,
  })

  const sync = useQuery({
    queryKey: ['system', 'sync'],
    queryFn: getSyncStatus,
    refetchInterval: 60_000,
    retry: 1,
  })

  const physDevices = useQuery({
    queryKey: ['physical-devices', 'count'],
    queryFn: getPhysicalDevicesCount,
    retry: 1,
  })

  const zigbeeDevices = useQuery({
    queryKey: ['zigbee-devices', 'count'],
    queryFn: getZigbeeDevicesCount,
    retry: 1,
  })

  const scenarios = useQuery({
    queryKey: ['scenarios', 'count'],
    queryFn: getScenariosCount,
    retry: 1,
  })

  const systemVariant: StatusVariant = health.isError
    ? 'error'
    : health.data?.status === 'ok'
      ? 'ok'
      : health.data?.status === 'degraded'
        ? 'warn'
        : 'neutral'

  const dbVariant: StatusVariant = health.isError
    ? 'error'
    : health.data?.db === 'ok'
      ? 'ok'
      : health.data
        ? 'warn'
        : 'neutral'

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>

      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          System
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Status"
            value={health.isError ? 'Offline' : (health.data?.status ?? 'Checking')}
            icon={<CheckCircle className="h-4 w-4" />}
            variant={systemVariant}
            loading={health.isPending}
            sub={health.isError ? 'Cannot reach server' : undefined}
          />
          <StatCard
            title="Database"
            value={health.isError ? '—' : (health.data?.db ?? '—')}
            icon={<Database className="h-4 w-4" />}
            variant={dbVariant}
            loading={health.isPending}
          />
          <StatCard
            title="Version"
            value={health.isError ? '—' : (health.data?.version ?? '—')}
            icon={<Tag className="h-4 w-4" />}
            variant={health.data ? 'ok' : 'neutral'}
            loading={health.isPending}
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Devices
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CountCard
            title="Physical Devices"
            count={physDevices.data}
            icon={<Cpu className="h-4 w-4" />}
            loading={physDevices.isPending}
            error={physDevices.isError}
          />
          <CountCard
            title="Zigbee Devices"
            count={zigbeeDevices.data}
            icon={<Radio className="h-4 w-4" />}
            loading={zigbeeDevices.isPending}
            error={zigbeeDevices.isError}
          />
          <CountCard
            title="Scenarios"
            count={scenarios.data}
            icon={<Workflow className="h-4 w-4" />}
            loading={scenarios.isPending}
            error={scenarios.isError}
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Cloud Sync
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          {sync.isError ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <CloudOff className="h-4 w-4" />
              Sync status unavailable
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <SyncRow
                label="Last Pull"
                value={sync.data?.lastPulledAt}
                loading={sync.isPending}
              />
              <SyncRow
                label="Last Push"
                value={sync.data?.lastPushedAt}
                loading={sync.isPending}
              />
              <div className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <ArrowUpDown className="h-4 w-4" />
                  Pending Outbox
                </span>
                {sync.isPending ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  <span
                    className={cn(
                      'text-sm font-medium',
                      (sync.data?.pendingOutbox ?? 0) > 10
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-800 dark:text-slate-200',
                    )}
                  >
                    {sync.data?.pendingOutbox ?? 0}
                    {(sync.data?.pendingOutbox ?? 0) > 10 && (
                      <span className="ml-1">
                        <AlertCircle className="inline h-4 w-4" />
                      </span>
                    )}
                  </span>
                )}
              </div>
              {sync.data?.lastPulledAt &&
                Date.now() - new Date(sync.data.lastPulledAt).getTime() > 10 * 60 * 1000 && (
                  <div className="flex items-center gap-2 py-2 text-sm text-amber-600 dark:text-amber-400">
                    <Clock className="h-4 w-4" />
                    Sync delayed — last pull over 10 minutes ago
                  </div>
                )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
