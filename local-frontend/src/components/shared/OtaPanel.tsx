import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CheckCircle, AlertTriangle, Loader2, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { getHealth, checkUpdate, applyUpdate } from '@/api/system'
import type { UpdateCheckResult } from '@/api/system'

type Phase = 'idle' | 'checking' | 'up-to-date' | 'has-update' | 'applying' | 'done' | 'error'

export function OtaPanel() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [checkResult, setCheckResult] = useState<UpdateCheckResult | null>(null)
  const [preApplyVersion, setPreApplyVersion] = useState<string | null>(null)

  const { data: health } = useQuery({
    queryKey: ['health-ota'],
    queryFn: getHealth,
    refetchInterval: phase === 'applying' ? 5_000 : false,
  })

  // Detect successful restart after apply
  useEffect(() => {
    if (phase !== 'applying' || !preApplyVersion || !health) return
    if (health.version !== preApplyVersion) {
      setPhase('done')
      toast.success(`Updated to ${health.version}`)
    }
  }, [phase, health, preApplyVersion])

  const checkMutation = useMutation({
    mutationFn: checkUpdate,
    onMutate: () => setPhase('checking'),
    onSuccess: (result) => {
      setCheckResult(result)
      setPhase(result.hasUpdate ? 'has-update' : 'up-to-date')
    },
    onError: () => {
      setPhase('error')
      toast.error('Failed to check for updates')
    },
  })

  const applyMutation = useMutation({
    mutationFn: applyUpdate,
    onMutate: () => {
      setPreApplyVersion(health?.version ?? null)
      setPhase('applying')
    },
    onError: () => {
      setPhase('error')
      toast.error('Update failed')
    },
  })

  return (
    <div className="space-y-4">
      {/* Current version */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-slate-400">Current version</span>
        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
          {health?.version ?? '—'}
        </span>
      </div>

      {/* Phase-specific UI */}
      {(phase === 'idle' || phase === 'up-to-date' || phase === 'error') && (
        <button
          onClick={() => checkMutation.mutate()}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Check for Updates
        </button>
      )}

      {phase === 'checking' && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking for updates…
        </div>
      )}

      {phase === 'up-to-date' && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-4 w-4" />
          Already up to date
        </div>
      )}

      {phase === 'has-update' && checkResult && (
        <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Update available
            </span>
            <span className="font-mono text-sm font-semibold text-blue-700 dark:text-blue-400">
              v{checkResult.latestVersion}
            </span>
          </div>

          {checkResult.releaseNotes && (
            <p className="text-xs text-blue-700 dark:text-blue-400">{checkResult.releaseNotes}</p>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
            Server will restart — you may lose connection for ~30 seconds
          </div>

          <button
            onClick={() => applyMutation.mutate()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Apply Update
          </button>
        </div>
      )}

      {phase === 'applying' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating… do not close this page
          </div>
          <p className="text-xs text-slate-400">Polling server health every 5 seconds…</p>
        </div>
      )}

      {phase === 'done' && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-4 w-4" />
          Updated to {health?.version} — server restarted successfully
        </div>
      )}

      {phase === 'error' && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Something went wrong. Check server logs.
        </p>
      )}
    </div>
  )
}
