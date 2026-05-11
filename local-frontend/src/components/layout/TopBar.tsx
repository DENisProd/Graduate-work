import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { useSettingsStore } from '@/stores/settings.store'

export function TopBar() {
  const { t, locale, setLocale } = useI18n()
  const {
    theme,
    setTheme,
    authStatus,
    authDisplayName,
    authExternalUserId,
  } = useSettingsStore()

  const resolvedUser = authDisplayName || authExternalUserId || ''
  const isAuthorized = authStatus === 'authorized'

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
      {resolvedUser ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="truncate max-w-[220px]">
            {isAuthorized
              ? resolvedUser
              : `${resolvedUser} (${authStatus || t('topBar.auth')})`}
          </span>
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
    </header>
  )
}
