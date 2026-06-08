import { useCallback, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Sun, Moon, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { resolveAccessServiceUrl } from '@/lib/server-url'
import { useSettingsStore } from '@/stores/settings.store'
import {
  completeDeviceAuthorization,
  getDeviceAuthorizationStatus,
  getRuntimeSettings,
  logoutDeviceAuthorization,
  resetLocalData,
  startDeviceAuthorization,
  updateRuntimeSettings,
} from '@/api/system'
import { SyncStatusPanel } from '@/components/shared/SyncStatusPanel'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{children}</h2>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      {children}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
  autoComplete,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  className?: string
  autoComplete?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors',
        'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
        'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500',
        'dark:focus:border-blue-400',
        className,
      )}
    />
  )
}

function Button({
  children,
  onClick,
  disabled,
  variant = 'primary',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
        variant === 'primary'
          ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600'
          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
      )}
    >
      {children}
    </button>
  )
}

export function SettingsPage() {
  const { t, locale, setLocale } = useI18n()
  const queryClient = useQueryClient()
  const {
    userId,
    theme,
    authSessionId,
    authUserCode,
    authVerificationUrl,
    authStatus,
    authCode,
    authExternalUserId,
    authDisplayName,
    authExpiresAt,
    isAuthPolling,
    setAccessServiceUrl,
    resetAuthState,
    resetLocalUiState,
    setAuthState,
    setTheme,
  } = useSettingsStore()

  const [accessServiceUrlDraft, setAccessServiceUrlDraft] = useState(() =>
    resolveAccessServiceUrl(useSettingsStore.getState().accessServiceUrl),
  )
  const [mqttUsernameDraft, setMqttUsernameDraft] = useState('')
  const [mqttPasswordDraft, setMqttPasswordDraft] = useState('')
  const [hasMqttPassword, setHasMqttPassword] = useState(false)
  const [authCountdownSec, setAuthCountdownSec] = useState<number | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)

  const { data: runtimeSettings } = useQuery({
    queryKey: ['runtime-settings'],
    queryFn: getRuntimeSettings,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (!runtimeSettings) return
    if (runtimeSettings.accessServiceUrl) {
      setAccessServiceUrlDraft(runtimeSettings.accessServiceUrl)
      setAccessServiceUrl(runtimeSettings.accessServiceUrl)
    }
    setMqttUsernameDraft(runtimeSettings.mqttUsername ?? '')
    setHasMqttPassword(Boolean(runtimeSettings.hasMqttPassword))
    setMqttPasswordDraft('')
    setAuthState({
      authSessionId: runtimeSettings.authSessionId ?? '',
      authStatus: runtimeSettings.authStatus ?? '',
      authCode: runtimeSettings.authCode ?? '',
      authExternalUserId: runtimeSettings.authExternalUserId ?? '',
      authDisplayName: runtimeSettings.authDisplayName ?? '',
      authExpiresAt: runtimeSettings.authExpiresAt ?? '',
    })
  }, [runtimeSettings, setAuthState, setAccessServiceUrl])

  const handleSaveGateway = async () => {
    const updated = await updateRuntimeSettings({
      accessServiceUrl: accessServiceUrlDraft,
      mqttUsername: mqttUsernameDraft.trim() || null,
      ...(mqttPasswordDraft.trim() ? { mqttPassword: mqttPasswordDraft } : {}),
    })
    if (updated.accessServiceUrl) {
      setAccessServiceUrl(updated.accessServiceUrl)
    }
    setMqttUsernameDraft(updated.mqttUsername ?? '')
    setHasMqttPassword(Boolean(updated.hasMqttPassword))
    setMqttPasswordDraft('')
    if (updated.mqttConnected) {
      toast.success(t('settings.toastGatewaySaved'))
    } else {
      toast.warning(t('settings.toastGatewaySavedMqttDisconnected'))
    }
  }

  const pollAuthStatus = useCallback(
    async (showTerminalToast = true) => {
      const res = await getDeviceAuthorizationStatus()
      setAuthState({
        authSessionId: res.authSessionId,
        authStatus: res.status,
        authCode: res.authCode ?? '',
        authExternalUserId: res.externalUserId ?? '',
        authDisplayName: res.displayName ?? '',
      })

      if (res.status === 'authorized') {
        setAuthState({ isAuthPolling: false })
        if (showTerminalToast) {
          toast.success(t('settings.toastDeviceAuthorized'))
        }
      } else if (res.status === 'denied') {
        setAuthState({ isAuthPolling: false })
        if (showTerminalToast) {
          toast.error(t('settings.toastAuthDenied'))
        }
      } else if (res.status === 'expired') {
        setAuthState({ isAuthPolling: false })
        if (showTerminalToast) {
          toast.error(t('settings.toastAuthExpired'))
        }
      }
    },
    [t],
  )

  const handleStartAuth = async () => {
    const res = await startDeviceAuthorization()
    const expiresAt = new Date(Date.now() + res.expiresIn * 1000).toISOString()
    setAuthState({
      authSessionId: res.authSessionId,
      authUserCode: res.userCode,
      authVerificationUrl: res.verificationUrl,
      authStatus: 'pending',
      authCode: '',
      authExternalUserId: '',
      authDisplayName: '',
      authExpiresAt: expiresAt,
      isAuthPolling: true,
    })
    toast.success(t('settings.toastAuthStarted'))
    toast.info(t('settings.toastAuthOpenUrl'))
  }

  const handlePollAuth = async () => {
    await pollAuthStatus(true)
  }

  const handleCompleteAuth = async () => {
    if (!authUserCode.trim()) {
      toast.error(t('settings.toastUserCodeRequired'))
      return
    }
    if (!userId.trim()) {
      toast.error(t('settings.toastUserIdRequired'))
      return
    }
    await completeDeviceAuthorization({
      userCode: authUserCode.trim(),
      externalUserId: userId.trim(),
      displayName: authDisplayName.trim() || undefined,
    })
    setAuthState({
      authExternalUserId: userId.trim(),
      authDisplayName: authDisplayName.trim(),
      authStatus: 'pending',
    })
    toast.success(t('settings.toastAuthConfirmSent'))
  }

  const handleLogoutAuth = async () => {
    await logoutDeviceAuthorization()
    resetAuthState()
    toast.success(t('settings.toastLogout'))
  }

  const handleResetData = async () => {
    setResetting(true)
    try {
      await resetLocalData()
      resetLocalUiState()
      await queryClient.invalidateQueries()
      toast.success(t('settings.toastDataReset'))
      setShowResetConfirm(false)
    } catch {
      toast.error(t('settings.toastDataResetFailed'))
    } finally {
      setResetting(false)
    }
  }

  useEffect(() => {
    if (!isAuthPolling || !authSessionId || authStatus !== 'pending') return
    const timer = window.setInterval(() => {
      void pollAuthStatus(true)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [authSessionId, authStatus, isAuthPolling, pollAuthStatus])

  useEffect(() => {
    if (authStatus === 'authorized' || authStatus === 'denied' || authStatus === 'expired') {
      setAuthState({ isAuthPolling: false })
    }
  }, [authStatus, setAuthState])

  useEffect(() => {
    if (!authExpiresAt || authStatus !== 'pending') {
      setAuthCountdownSec(null)
      return
    }

    const tick = () => {
      const leftMs = new Date(authExpiresAt).getTime() - Date.now()
      const leftSec = Math.max(0, Math.ceil(leftMs / 1000))
      setAuthCountdownSec(leftSec)
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [authExpiresAt, authStatus])

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('settings.title')}</h1>

      <section>
        <SectionTitle>{t('settings.gateway')}</SectionTitle>
        <Card>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            {t('settings.gatewayHint')}
          </p>
          <div className="space-y-4">
            {runtimeSettings?.mqttUrl && (
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t('settings.mqttLocal')}
                  <span
                    className={cn(
                      'ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                      runtimeSettings.mqttConnected
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
                    )}
                  >
                    {runtimeSettings.mqttConnected ? t('settings.mqttConnected') : t('settings.mqttDisconnected')}
                  </span>
                </p>
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {runtimeSettings.mqttUrl}
                </p>
              </div>
            )}
            {runtimeSettings?.mqttCloudUrl && (
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t('settings.mqttCloud')}
                  <span
                    className={cn(
                      'ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                      runtimeSettings.mqttCloudConnected
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
                    )}
                  >
                    {runtimeSettings.mqttCloudConnected ? t('settings.mqttConnected') : t('settings.mqttDisconnected')}
                  </span>
                </p>
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {runtimeSettings.mqttCloudUrl}
                </p>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                {t('settings.gatewayUrl')}
              </p>
              <Input
                value={accessServiceUrlDraft}
                onChange={setAccessServiceUrlDraft}
                placeholder="http://localhost:8082"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                {t('settings.mqttUsername')}
              </p>
              <Input
                value={mqttUsernameDraft}
                onChange={setMqttUsernameDraft}
                placeholder="scenario-service"
                autoComplete="username"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                {t('settings.mqttPassword')}
              </p>
              <Input
                type="password"
                value={mqttPasswordDraft}
                onChange={setMqttPasswordDraft}
                placeholder={hasMqttPassword ? t('settings.mqttPasswordKeep') : t('settings.mqttPasswordPlaceholder')}
                autoComplete="current-password"
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {t('settings.mqttCredentialsHint')}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={() => void handleSaveGateway()}>{t('settings.saveGateway')}</Button>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>{t('settings.cloudAuth')}</SectionTitle>
        <Card>
          <div className="space-y-3">
            {authStatus !== 'authorized' ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.cloudAuthSteps')}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button onClick={() => void handleStartAuth()}>{t('settings.startSession')}</Button>
              {authStatus !== 'authorized' ? (
                <Button variant="secondary" onClick={() => void handlePollAuth()}>
                  {t('settings.pollStatus')}
                </Button>
              ) : null}
            </div>
            {authSessionId && authStatus === 'authorized' ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
                <div className="font-mono text-[11px] text-emerald-800/90 dark:text-emerald-200/90">
                  {t('common.session')}: {authSessionId}
                </div>
                <p className="mt-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  {t('settings.authSuccess')}
                </p>
              </div>
            ) : authSessionId ? (
              <div className="rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-800">
                <div>
                  {t('common.session')}: {authSessionId}
                </div>
                <div>
                  {t('common.userCode')}: {authUserCode || '—'}
                </div>
                <div>
                  {t('common.verificationUrl')}:{' '}
                  {authVerificationUrl ? (
                    <a
                      className="text-blue-600 underline dark:text-blue-400"
                      href={authVerificationUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {authVerificationUrl}
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
                <div>
                  {t('common.status')}: {authStatus || '—'}
                </div>
                <div>
                  {t('common.authCode')}: {authCode || '—'}
                </div>
                <div>
                  {t('common.user')}: {authDisplayName || authExternalUserId || '—'}
                </div>
                <div>
                  {t('common.expiresIn')}:{' '}
                  {authStatus === 'pending' && authCountdownSec != null ? `${authCountdownSec}s` : '—'}
                </div>
              </div>
            ) : null}
            {authStatus !== 'authorized' ? (
              <>
                <Input
                  value={authUserCode}
                  onChange={(v) => setAuthState({ authUserCode: v })}
                  placeholder="ABCD-EFGH"
                />
                <Input
                  value={authDisplayName}
                  onChange={(v) => setAuthState({ authDisplayName: v })}
                  placeholder={t('settings.optionalDisplayName')}
                />
                <Button variant="secondary" onClick={() => void handleCompleteAuth()}>
                  {t('settings.confirmUserCode')}
                </Button>
              </>
            ) : null}
            <Button variant="secondary" onClick={() => void handleLogoutAuth()}>
              {t('settings.logoutLocal')}
            </Button>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>{t('settings.appearance')}</SectionTitle>
        <Card>
          <p className="mb-3 text-xs font-medium text-slate-600 dark:text-slate-400">{t('settings.language')}</p>
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm transition-colors',
                locale === 'en'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800',
              )}
            >
              {t('settings.langEn')}
            </button>
            <button
              type="button"
              onClick={() => setLocale('ru')}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm transition-colors',
                locale === 'ru'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800',
              )}
            >
              {t('settings.langRu')}
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors',
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800',
              )}
            >
              <Sun className="h-4 w-4" />
              {t('settings.light')}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors',
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800',
              )}
            >
              <Moon className="h-4 w-4" />
              {t('settings.dark')}
            </button>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>{t('settings.cloudSync')}</SectionTitle>
        <Card>
          <SyncStatusPanel />
        </Card>
      </section>

      <section>
        <SectionTitle>{t('settings.dataReset')}</SectionTitle>
        <Card>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            {t('settings.dataResetHint')}
          </p>
          <Button variant="secondary" onClick={() => setShowResetConfirm(true)}>
            {t('settings.resetData')}
          </Button>
        </Card>
      </section>

      {showResetConfirm && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => !resetting && setShowResetConfirm(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {t('settings.resetDataTitle')}
              </h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('settings.resetDataBody')}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => void handleResetData()}
                disabled={resetting}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {resetting ? '…' : t('settings.resetDataConfirm')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
