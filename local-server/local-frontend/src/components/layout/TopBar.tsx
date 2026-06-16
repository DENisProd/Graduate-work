import { Sun, Moon, Menu, LogOut, User } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { useSettingsStore } from '@/stores/settings.store'

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { t, locale, setLocale } = useI18n()
  const {
    theme,
    setTheme,
    authStatus,
    authDisplayName,
    authExternalUserId,
    localUserId,
    localUserName,
    clearLocalSession,
  } = useSettingsStore()

  const resolvedUser = authDisplayName || authExternalUserId || ''
  const isAuthorized = authStatus === 'authorized'

  const handleLogout = () => {
    clearLocalSession()
    toast.success(t('auth.toastSignedOut'))
  }

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
      <button
        onClick={onMenuClick}
        className="mr-2 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex flex-1 items-center justify-end gap-3">
      {localUserId ? (
        <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 py-1 pl-2.5 pr-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span className="truncate max-w-[160px] font-medium">{localUserName}</span>
          <button
            onClick={handleLogout}
            className="ml-0.5 rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            aria-label={t('auth.signOut')}
            title={t('auth.signOut')}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
      <div
        className="flex items-center rounded-md border border-slate-200 p-0.5 dark:border-slate-700"
        role="group"
        aria-label={t('settings.language')}
      >
        {(['en', 'ru'] as const).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={cn(
              'rounded px-2 py-1 text-xs font-medium transition-colors',
              locale === code
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
            )}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        aria-label={t('topBar.toggleTheme')}
        title={t('topBar.toggleTheme')}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      </div>
    </header>
  )
}
