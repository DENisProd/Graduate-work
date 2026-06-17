import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import type { Locale } from 'date-fns/locale'
import { useI18n } from '@/hooks/useI18n'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  Cpu,
  Radio,
  Workflow,
  CloudOff,
  Clock,
  ArrowUpDown,
  LayoutDashboard,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getHealth,
  getSyncStatus,
  getZigbeeDevicesCount,
  getModbusDevicesCount,
  getScenariosCount,
} from '@/api/system'
import { listLocalHouses } from '@/api/local-access'
import { listWidgetDashboards, createWidgetDashboard } from '@/api/widget-dashboards'
import { useSettingsStore } from '@/stores/settings.store'
import { WidgetDashboardEditor } from '@/components/widgets/WidgetDashboardEditor'
import { toast } from 'sonner'

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
  compact?: boolean
}

function StatCard({ title, value, icon, variant = 'neutral', loading, sub, compact = false }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
        compact ? 'p-3 sm:p-4' : 'p-4',
      )}
    >
      <div className={cn('flex items-center justify-between', compact ? 'mb-2 sm:mb-3' : 'mb-3')}>
        <span
          className={cn(
            'font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400',
            compact ? 'text-[10px] sm:text-xs' : 'text-xs',
          )}
        >
          {title}
        </span>
        <div className="text-slate-400">{icon}</div>
      </div>
      {loading ? (
        <>
          <Skeleton className={cn('mb-1', compact ? 'h-5 w-16 sm:h-7 sm:w-20' : 'h-7 w-20')} />
          <Skeleton className={cn(compact ? 'h-3 w-12 sm:h-4 sm:w-16' : 'h-4 w-16')} />
        </>
      ) : (
        <>
          <div className={cn('flex items-center', compact ? 'gap-1.5 sm:gap-2' : 'gap-2')}>
            <StatusIcon variant={variant} />
            <span
              className={cn(
                'min-w-0 truncate font-semibold text-slate-900 dark:text-slate-100',
                compact ? 'text-sm sm:text-xl' : 'text-xl',
              )}
            >
              {value}
            </span>
          </div>
          {sub && (
            <p
              className={cn(
                'mt-1 text-slate-500 dark:text-slate-400',
                compact ? 'hidden text-[10px] sm:block sm:text-xs' : 'text-xs',
              )}
            >
              {sub}
            </p>
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
  neverLabel,
  dateLocale,
}: {
  label: string
  value: string | null | undefined
  loading: boolean
  neverLabel: string
  dateLocale: Locale
}) {
  const formatted = value
    ? formatDistanceToNow(new Date(value), { addSuffix: true, locale: dateLocale })
    : neverLabel

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
  const { t, dateLocale } = useI18n()
  const userId = useSettingsStore((s) => s.userId)
  const queryClient = useQueryClient()
  const [activeDashId, setActiveDashId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const housesQ = useQuery({
    queryKey: ['local-houses', userId],
    queryFn: () => listLocalHouses(userId || undefined),
    staleTime: 60_000,
  })
  const house = housesQ.data?.[0]

  const dashboardsQ = useQuery({
    queryKey: ['widget-dashboards', house?.id],
    queryFn: () => listWidgetDashboards(house!.id),
    enabled: !!house,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
  const dashboards = dashboardsQ.data ?? []
  const activeDash =
    dashboards.find((d) => d.id === activeDashId) ??
    dashboards.find((d) => d.isDefault) ??
    dashboards[0] ??
    null

  const createMutation = useMutation({
    mutationFn: () =>
      createWidgetDashboard({
        houseId: house!.id,
        userId: userId ?? 'local',
        name: 'Мой дашборд',
        isDefault: true,
        layouts: {},
        widgets: [],
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['widget-dashboards'] })
      setActiveDashId(created.id)
      toast.success('Дашборд создан')
    },
    onError: () => toast.error('Не удалось создать дашборд'),
    onSettled: () => setCreating(false),
  })

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

  const zigbeeDevices = useQuery({
    queryKey: ['zigbee-devices', 'count'],
    queryFn: getZigbeeDevicesCount,
    retry: 1,
  })

  const modbusDevices = useQuery({
    queryKey: ['modbus-devices', 'count'],
    queryFn: getModbusDevicesCount,
    retry: 1,
  })

  const scenarios = useQuery({
    queryKey: ['scenarios', 'count'],
    queryFn: getScenariosCount,
    retry: 1,
  })

  const totalDevices = (zigbeeDevices.data ?? 0) + (modbusDevices.data ?? 0)
  const devicesLoading = zigbeeDevices.isPending || modbusDevices.isPending
  const devicesError = zigbeeDevices.isError && modbusDevices.isError

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
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.title')}</h1>

      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t('dashboard.system')}
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
          <StatCard
            title={t('dashboard.status')}
            value={health.isError ? t('dashboard.offline') : (health.data?.status ?? t('dashboard.checking'))}
            icon={<CheckCircle className="h-4 w-4" />}
            variant={systemVariant}
            loading={health.isPending}
            sub={health.isError ? t('dashboard.cannotReachServer') : undefined}
            compact
          />
          <StatCard
            title={t('dashboard.database')}
            value={health.isError ? '—' : (health.data?.db ?? '—')}
            icon={<Database className="h-4 w-4" />}
            variant={dbVariant}
            loading={health.isPending}
            compact
          />
        </div>
      </section>

      {/* ── Widgets ── */}
      {house && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('dashboard.widgetsTitle')}
            </h2>
            <div className="flex items-center gap-2">
              {dashboards.length > 1 && dashboards.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDashId(d.id)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                    activeDash?.id === d.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                  )}
                >
                  {d.name}
                </button>
              ))}
              <button
                onClick={() => { setCreating(true); createMutation.mutate() }}
                disabled={creating || createMutation.isPending}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                title="Создать новый дашборд"
              >
                <Plus className="h-3 w-3" />
                Дашборд
              </button>
            </div>
          </div>

          {dashboardsQ.isPending && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
                />
              ))}
            </div>
          )}

          {activeDash && <WidgetDashboardEditor key={activeDash.id} dashboard={activeDash} />}

          {dashboardsQ.isSuccess && dashboards.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 py-10 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <LayoutDashboard className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t('dashboard.noWidgets')}
              </p>
              <p className="max-w-sm text-xs text-slate-400 dark:text-slate-500">
                {t('dashboard.noWidgetsHint')}
              </p>
              <button
                onClick={() => { setCreating(true); createMutation.mutate() }}
                disabled={creating || createMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Создать дашборд
              </button>
            </div>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t('dashboard.devices')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CountCard
            title={t('dashboard.totalDevices')}
            count={totalDevices}
            icon={<Cpu className="h-4 w-4" />}
            loading={devicesLoading}
            error={devicesError}
          />
          <CountCard
            title={t('dashboard.zigbeeDevices')}
            count={zigbeeDevices.data}
            icon={<Radio className="h-4 w-4" />}
            loading={zigbeeDevices.isPending}
            error={zigbeeDevices.isError}
          />
          <CountCard
            title={t('dashboard.scenarios')}
            count={scenarios.data}
            icon={<Workflow className="h-4 w-4" />}
            loading={scenarios.isPending}
            error={scenarios.isError}
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t('dashboard.cloudSync')}
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          {sync.isError ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <CloudOff className="h-4 w-4" />
              {t('dashboard.syncUnavailable')}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <SyncRow
                label={t('dashboard.lastPull')}
                value={sync.data?.lastPulledAt}
                loading={sync.isPending}
                neverLabel={t('common.never')}
                dateLocale={dateLocale}
              />
              <SyncRow
                label={t('dashboard.lastPush')}
                value={sync.data?.lastPushedAt}
                loading={sync.isPending}
                neverLabel={t('common.never')}
                dateLocale={dateLocale}
              />
              <div className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <ArrowUpDown className="h-4 w-4" />
                  {t('dashboard.pendingOutbox')}
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
                    {t('dashboard.syncDelayed')}
                  </div>
                )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
