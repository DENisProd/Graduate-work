import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO, differenceInMilliseconds } from 'date-fns'
import { Plus, Play, Pencil, Trash2, X, AlertTriangle, ChevronLeft, ChevronRight, Settings, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import {
  listScenarios,
  deleteScenario,
  triggerScenario,
  listExecutions,
} from '@/api/scenarios'
import type { Scenario, ScenarioExecution } from '@/types'

type Tab = 'scenarios' | 'history'

// ── Badges ────────────────────────────────────────────────────────────────────

function ScenarioStatusBadge({ status, t }: { status: Scenario['status']; t: (k: string) => string }) {
  if (status === 'ONLINE')
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        {t('scenarios.statusOnline')}
      </span>
    )
  if (status === 'ERROR')
    return (
      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <AlertTriangle className="h-3 w-3" /> {t('scenarios.statusError')}
      </span>
    )
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
      {t('scenarios.statusOffline')}
    </span>
  )
}

function ExecutionStatusBadge({
  status,
  t,
}: {
  status: ScenarioExecution['status']
  t: (k: string) => string
}) {
  const classes: Record<ScenarioExecution['status'], string> = {
    RUNNING:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse',
    SUCCESS:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    SKIPPED:
      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }
  const label =
    status === 'RUNNING'
      ? t('scenarios.execRunning')
      : status === 'SUCCESS'
        ? t('scenarios.execSuccess')
        : status === 'FAILED'
          ? t('scenarios.execFailed')
          : t('scenarios.execSkipped')
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', classes[status])}>
      {label}
    </span>
  )
}

// ── Confirm dialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({
  name,
  onConfirm,
  onCancel,
  t,
}: {
  name: string
  onConfirm: () => void
  onCancel: () => void
  t: (k: string, v?: Record<string, string | number | undefined>) => string
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('scenarios.deleteTitle')}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t('scenarios.deleteBody', { name })}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Execution detail drawer ────────────────────────────────────────────────────

function ExecutionDrawer({
  exec,
  onClose,
  t,
}: {
  exec: ScenarioExecution
  onClose: () => void
  t: (k: string) => string
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col bg-white shadow-2xl dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              {exec.scenarioName ?? exec.scenarioId}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {format(parseISO(exec.triggeredAt), 'dd MMM yyyy HH:mm:ss')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-3">
            <ExecutionStatusBadge status={exec.status} t={t} />
            <span className="text-xs text-slate-500">
              {t('scenarios.drawerTrigger')}: {exec.triggerType}
            </span>
          </div>

          {exec.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-xs font-medium text-red-700 dark:text-red-400">{t('scenarios.drawerError')}</p>
              <p className="mt-1 font-mono text-xs text-red-600 dark:text-red-300">{exec.error}</p>
            </div>
          )}

          {exec.logs && exec.logs.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('scenarios.drawerLogs')}
              </p>
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                {exec.logs.map((line, i) => (
                  <p key={i} className="font-mono text-xs text-slate-700 dark:text-slate-300">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Execution duration ─────────────────────────────────────────────────────────

function duration(exec: ScenarioExecution, t: (k: string) => string): string {
  if (!exec.finishedAt) return exec.status === 'RUNNING' ? t('scenarios.durationRunning') : '—'
  const ms = differenceInMilliseconds(parseISO(exec.finishedAt), parseISO(exec.triggeredAt))
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

const EXEC_PAGE_SIZE = 20

// ── Main page ──────────────────────────────────────────────────────────────────

export function ScenariosPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('scenarios')
  const [pendingDelete, setPendingDelete] = useState<Scenario | null>(null)
  const [selectedExec, setSelectedExec] = useState<ScenarioExecution | null>(null)
  const [filterScenarioId, setFilterScenarioId] = useState('')
  const [execPage, setExecPage] = useState(0)

  const { data: scenarios = [], isPending: scenariosLoading } = useQuery<Scenario[]>({
    queryKey: ['scenarios'],
    queryFn: () => listScenarios(),
  })

  const { data: execsPage, isPending: execsLoading } = useQuery({
    queryKey: ['scenario-executions', filterScenarioId, execPage],
    queryFn: () =>
      listExecutions({
        ...(filterScenarioId ? { scenarioId: filterScenarioId } : {}),
        page: execPage,
        limit: EXEC_PAGE_SIZE,
      }),
    enabled: tab === 'history',
    refetchInterval: 10_000,
  })

  const executions = execsPage?.content ?? []
  const execTotalPages = execsPage?.totalPages ?? 0

  const triggerMutation = useMutation({
    mutationFn: (id: string) => triggerScenario(id),
    onSuccess: () => {
      toast.success(t('scenarios.toastTriggered'))
      queryClient.invalidateQueries({ queryKey: ['scenario-executions'] })
    },
    onError: () => toast.error(t('scenarios.toastTriggerFailed')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteScenario(id),
    onSuccess: () => {
      toast.success(t('scenarios.toastDeleted'))
      setPendingDelete(null)
      queryClient.invalidateQueries({ queryKey: ['scenarios'] })
    },
    onError: () => toast.error(t('scenarios.toastDeleteFailed')),
  })

  const TABS: { key: Tab; labelKey: 'scenarios.tabScenarios' | 'scenarios.tabHistory' }[] = [
    { key: 'scenarios', labelKey: 'scenarios.tabScenarios' },
    { key: 'history', labelKey: 'scenarios.tabHistory' },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('scenarios.title')}</h1>
        {tab === 'scenarios' && (
          <button
            onClick={() => navigate('/scenarios/new')}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> {t('scenarios.newScenario')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === key
                ? 'border-b-2 border-blue-600 text-blue-700 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            {t(labelKey)}
            {key === 'scenarios' && scenarios.length > 0 && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {scenarios.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Scenarios tab ── */}
      {tab === 'scenarios' && (
        <>
          {scenariosLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : scenarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Settings className="mb-4 h-12 w-12 text-slate-400 dark:text-slate-600" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">{t('scenarios.emptyTitle')}</p>
              <p className="mt-1 text-sm text-slate-400">
                {t('scenarios.emptySubtitle')}
              </p>
              <button
                onClick={() => navigate('/scenarios/new')}
                className="mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" /> {t('scenarios.createFirst')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                        {scenario.name}
                      </p>
                      {scenario.description && (
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {scenario.description}
                        </p>
                      )}
                    </div>
                    <ScenarioStatusBadge status={scenario.status} t={t} />
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    {t(
                      scenario.definition.triggers.length === 1
                        ? 'scenarios.triggersOne'
                        : 'scenarios.triggersMany',
                      { count: scenario.definition.triggers.length },
                    )}{' '}
                    ·{' '}
                    {t(
                      scenario.definition.actions.length === 1
                        ? 'scenarios.actionsOne'
                        : 'scenarios.actionsMany',
                      { count: scenario.definition.actions.length },
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <button
                      onClick={() => triggerMutation.mutate(scenario.id)}
                      disabled={triggerMutation.isPending}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                    >
                      <Play className="h-3.5 w-3.5" /> {t('scenarios.run')}
                    </button>
                    <button
                      onClick={() => navigate(`/scenarios/${scenario.id}/edit`)}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      title={t('scenarios.edit')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setPendingDelete(scenario)}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title={t('scenarios.delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── History tab ── */}
      {tab === 'history' && (
        <div className="space-y-3">
          {/* Filter */}
          <select
            value={filterScenarioId}
            onChange={(e) => { setFilterScenarioId(e.target.value); setExecPage(0) }}
            className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">{t('scenarios.allScenarios')}</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {execsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ClipboardList className="mb-3 h-10 w-10 text-slate-400 dark:text-slate-600" />
              <p className="text-sm text-slate-400">{t('scenarios.historyEmpty')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                    <tr>
                      {[
                        t('scenarios.historyCols.time'),
                        t('scenarios.historyCols.scenario'),
                        t('scenarios.historyCols.status'),
                        t('scenarios.historyCols.trigger'),
                        t('scenarios.historyCols.duration'),
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {executions.map((exec) => (
                      <tr
                        key={exec.id}
                        onClick={() => setSelectedExec(exec)}
                        className="cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                          {format(parseISO(exec.triggeredAt), 'dd MMM HH:mm:ss')}
                        </td>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                          {exec.scenarioName ?? exec.scenarioId}
                        </td>
                        <td className="px-4 py-3">
                          <ExecutionStatusBadge status={exec.status} t={t} />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {exec.triggerType}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {duration(exec, t)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {execTotalPages > 1 && (
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs text-slate-500">
                    {t('common.pageOf', { current: execPage + 1, total: execTotalPages })}
                  </span>
                  <button
                    onClick={() => setExecPage((p) => Math.max(0, p - 1))}
                    disabled={execPage === 0}
                    className="rounded-lg border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setExecPage((p) => Math.min(execTotalPages - 1, p + 1))}
                    disabled={execPage >= execTotalPages - 1}
                    className="rounded-lg border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {pendingDelete && (
        <ConfirmDialog
          name={pendingDelete.name}
          onConfirm={() => deleteMutation.mutate(pendingDelete.id)}
          onCancel={() => setPendingDelete(null)}
          t={t}
        />
      )}
      {selectedExec && (
        <ExecutionDrawer exec={selectedExec} onClose={() => setSelectedExec(null)} t={t} />
      )}
    </div>
  )
}
