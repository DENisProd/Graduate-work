import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, LogIn, ShieldCheck, KeyRound, User, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/useI18n'
import { useSettingsStore } from '@/stores/settings.store'
import { listAuthUsers, login, changePassword, type LocalAuthUser } from '@/api/auth'

// ── Shared layout shell ───────────────────────────────────────────────────────

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 p-4 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {children}
      </div>
    </div>
  )
}

// ── Login screen ──────────────────────────────────────────────────────────────

function LoginScreen({ users }: { users: LocalAuthUser[] }) {
  const { t } = useI18n()
  const setLocalSession = useSettingsStore((s) => s.setLocalSession)
  const [selected, setSelected] = useState<LocalAuthUser | null>(
    users.length === 1 ? users[0] : null,
  )
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const userLabel = (u: LocalAuthUser) => u.displayName || u.externalUserId

  const handleLogin = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      const user = await login(selected.id, password)
      setLocalSession(user)
      toast.success(t('auth.toastWelcome', { name: userLabel(user) }))
    } catch {
      toast.error(t('auth.toastInvalid'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
          <LogIn className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('auth.loginTitle')}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('auth.loginSubtitle')}</p>
      </div>

      {!selected ? (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => {
                  setSelected(u)
                  setPassword('')
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-blue-900/10"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                    {userLabel(u)}
                  </span>
                  {u.isOwner && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {t('auth.ownerBadge')}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-4">
          {users.length > 1 && (
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('auth.backToUsers')}
            </button>
          )}

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <User className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-200">
              {userLabel(selected)}
            </span>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('auth.passwordLabel')}
            </label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && password && handleLogin()}
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <p className="mt-1.5 text-xs text-slate-400">{t('auth.defaultPasswordHint')}</p>
          </div>

          <button
            onClick={handleLogin}
            disabled={!password || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {submitting ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </div>
      )}
    </AuthShell>
  )
}

// ── Forced password change ────────────────────────────────────────────────────

function ChangePasswordScreen() {
  const { t } = useI18n()
  const localUserId = useSettingsStore((s) => s.localUserId)
  const localUserName = useSettingsStore((s) => s.localUserName)
  const setLocalMustChange = useSettingsStore((s) => s.setLocalMustChange)
  const clearLocalSession = useSettingsStore((s) => s.clearLocalSession)

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (next !== confirm) {
      toast.error(t('auth.toastMismatch'))
      return
    }
    setSubmitting(true)
    try {
      await changePassword(localUserId, current, next)
      setLocalMustChange(false)
      toast.success(t('auth.toastPasswordChanged'))
    } catch {
      toast.error(t('auth.toastChangeFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('auth.changeRequiredTitle')}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('auth.changeRequiredSubtitle', { name: localUserName })}
        </p>
      </div>

      <div className="space-y-3">
        <PasswordField
          label={t('auth.currentPasswordLabel')}
          value={current}
          onChange={setCurrent}
          autoFocus
          hint={t('auth.defaultPasswordHint')}
        />
        <PasswordField label={t('auth.newPasswordLabel')} value={next} onChange={setNext} />
        <PasswordField label={t('auth.confirmPasswordLabel')} value={confirm} onChange={setConfirm} />

        <button
          onClick={handleSubmit}
          disabled={!current || !next || !confirm || submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {submitting ? t('auth.saving') : t('auth.changePassword')}
        </button>
        <button
          onClick={clearLocalSession}
          className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          {t('auth.signOut')}
        </button>
      </div>
    </AuthShell>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  autoFocus,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
  hint?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
        {label}
      </label>
      <input
        type="password"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

// ── Gate ──────────────────────────────────────────────────────────────────────

export function LoginGate({ children }: { children: ReactNode }) {
  const localUserId = useSettingsStore((s) => s.localUserId)
  const localUserMustChange = useSettingsStore((s) => s.localUserMustChange)

  const { data: users, isLoading } = useQuery({
    queryKey: ['auth-users'],
    queryFn: listAuthUsers,
    staleTime: 0,
    retry: 0,
  })

  // Logged in: force a password change when required, otherwise show the app.
  if (localUserId) {
    if (localUserMustChange) return <ChangePasswordScreen />
    return <>{children}</>
  }

  // Not logged in — wait for the user list before deciding.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  // No users yet (server not paired with the cloud) — allow setup access.
  if (!users || users.length === 0) return <>{children}</>

  return <LoginScreen users={users} />
}
