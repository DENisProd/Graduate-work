import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Loader2, Sun, Moon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { useSettingsStore } from '@/stores/settings.store'
import {
  completeDeviceAuthorization,
  getDeviceAuthorizationStatus,
  getHealth,
  getRuntimeSettings,
  logoutDeviceAuthorization,
  startDeviceAuthorization,
  updateRuntimeSettings,
} from '@/api/system'
import { OtaPanel } from '@/components/shared/OtaPanel'
import { SyncStatusPanel } from '@/components/shared/SyncStatusPanel'

type ConnectionStatus = 'idle' | 'checking' | 'ok' | 'error'

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
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  className?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
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
    serverUrl,
    mqttGatewayUrl,
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
    setServerUrl,
    setAccessServiceUrl,
    setMqttGatewayUrl,
    setUserId,
    resetAuthState,
    setAuthState,
    setTheme,
  } = useSettingsStore()

  const [urlDraft, setUrlDraft] = useState(serverUrl)
  const [mqttDraft, setMqttDraft] = useState(mqttGatewayUrl)
  const [accessServiceUrlDraft, setAccessServiceUrlDraft] = useState('http://localhost:8085')
  const [userIdDraft, setUserIdDraft] = useState(userId)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
  const [connectionVersion, setConnectionVersion] = useState<string>('')
  const [authCountdownSec, setAuthCountdownSec] = useState<number | null>(null)

  const { data: runtimeSettings } = useQuery({
    queryKey: ['runtime-settings'],
    queryFn: getRuntimeSettings,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (!runtimeSettings) return
    if (runtimeSettings.mqttGatewayUrl) {
      setMqttDraft(runtimeSettings.mqttGatewayUrl)
      setMqttGatewayUrl(runtimeSettings.mqttGatewayUrl)
    }
    if (runtimeSettings.accessServiceUrl) {
      setAccessServiceUrlDraft(runtimeSettings.accessServiceUrl)
      setAccessServiceUrl(runtimeSettings.accessServiceUrl)
    }
    setAuthState({
      authSessionId: runtimeSettings.authSessionId ?? '',
      authStatus: runtimeSettings.authStatus ?? '',
      authCode: runtimeSettings.authCode ?? '',
      authExternalUserId: runtimeSettings.authExternalUserId ?? '',
      authDisplayName: runtimeSettings.authDisplayName ?? '',
      authExpiresAt: runtimeSettings.authExpiresAt ?? '',
    })
  }, [runtimeSettings, setAuthState, setMqttGatewayUrl, setAccessServiceUrl])

  const handleSaveUrl = () => {
    setServerUrl(urlDraft)
    queryClient.invalidateQueries()
    toast.success(t('settings.toastServerUrlSaved'))
  }

  const handleTestConnection = async () => {
    setConnectionStatus('checking')
    setConnectionVersion('')
    try {
      setServerUrl(urlDraft)
      const health = await getHealth()
      setConnectionStatus('ok')
      setConnectionVersion(health.version)
    } catch {
      setConnectionStatus('error')
    }
  }

  const handleSaveUserId = () => {
    setUserId(userIdDraft)
    queryClient.invalidateQueries()
    toast.success(t('settings.toastUserIdSaved'))
  }

  const handleSaveGateway = async () => {
    const updated = await updateRuntimeSettings({
      mqttGatewayUrl: mqttDraft,
      accessServiceUrl: accessServiceUrlDraft,
    })
    setMqttGatewayUrl(mqttDraft)
    if (updated.accessServiceUrl) {
      setAccessServiceUrl(updated.accessServiceUrl)
    }
    toast.success(t('settings.toastGatewaySaved'))
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
    if (!userIdDraft.trim()) {
      toast.error(t('settings.toastUserIdRequired'))
      return
    }
    await completeDeviceAuthorization({
      userCode: authUserCode.trim(),
      externalUserId: userIdDraft.trim(),
      displayName: authDisplayName.trim() || undefined,
    })
    setAuthState({
      authExternalUserId: userIdDraft.trim(),
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
        <SectionTitle>{t('settings.connection')}</SectionTitle>
        <Card>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            {t('settings.connectionHint')}
          </p>
          <div className="flex gap-2">
            <Input
              value={urlDraft}
              onChange={setUrlDraft}
              placeholder="http://localhost:8080"
              className="flex-1"
            />
            <Button variant="secondary" onClick={handleTestConnection} disabled={connectionStatus === 'checking'}>
              {connectionStatus === 'checking' && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t('common.test')}
            </Button>
            <Button onClick={handleSaveUrl}>{t('common.save')}</Button>
          </div>

          {connectionStatus === 'ok' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              {t('settings.connectedVersion', { version: connectionVersion })}
            </div>
          )}
          {connectionStatus === 'error' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              {t('settings.connectionFailed')}
            </div>
          )}
        </Card>
      </section>

      <section>
        <SectionTitle>{t('settings.gateway')}</SectionTitle>
        <Card>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            {t('settings.gatewayHint')}
          </p>
          <div className="space-y-2">
            <Input
              value={mqttDraft}
              onChange={setMqttDraft}
              placeholder="mqtt://localhost:1883"
            />
            <Input
              value={accessServiceUrlDraft}
              onChange={setAccessServiceUrlDraft}
              placeholder="http://localhost:8085"
            />
          </div>
          <div className="mt-3">
            <Button onClick={() => void handleSaveGateway()}>{t('settings.saveGateway')}</Button>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>{t('settings.identity')}</SectionTitle>
        <Card>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            {t('settings.identityHint')}
          </p>
          <div className="flex gap-2">
            <Input
              value={userIdDraft}
              onChange={setUserIdDraft}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="flex-1 font-mono text-xs"
            />
            <Button onClick={handleSaveUserId}>{t('common.save')}</Button>
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
        <SectionTitle>{t('settings.systemUpdates')}</SectionTitle>
        <Card>
          <OtaPanel />
        </Card>
      </section>

      <section>
        <SectionTitle>{t('settings.cloudSync')}</SectionTitle>
        <Card>
          <SyncStatusPanel />
        </Card>
      </section>
    </div>
  )
}
