import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Loader2, Sun, Moon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settings.store'
import { getHealth } from '@/api/system'
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
  const queryClient = useQueryClient()
  const { serverUrl, userId, theme, setServerUrl, setUserId, setTheme } = useSettingsStore()

  const [urlDraft, setUrlDraft] = useState(serverUrl)
  const [userIdDraft, setUserIdDraft] = useState(userId)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
  const [connectionVersion, setConnectionVersion] = useState<string>('')

  const handleSaveUrl = () => {
    setServerUrl(urlDraft)
    queryClient.invalidateQueries()
    toast.success('Server URL saved')
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
    toast.success('User ID saved')
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>

      <section>
        <SectionTitle>Connection</SectionTitle>
        <Card>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            URL of the local Rust server (e.g.{' '}
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">
              http://192.168.1.100:8080
            </code>
            )
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
              Test
            </Button>
            <Button onClick={handleSaveUrl}>Save</Button>
          </div>

          {connectionStatus === 'ok' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              Connected — version {connectionVersion}
            </div>
          )}
          {connectionStatus === 'error' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              Connection failed — check URL and server status
            </div>
          )}
        </Card>
      </section>

      <section>
        <SectionTitle>Identity</SectionTitle>
        <Card>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            User UUID sent as{' '}
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">X-User-Id</code> header
            with every request.
          </p>
          <div className="flex gap-2">
            <Input
              value={userIdDraft}
              onChange={setUserIdDraft}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="flex-1 font-mono text-xs"
            />
            <Button onClick={handleSaveUserId}>Save</Button>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>Appearance</SectionTitle>
        <Card>
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
              Light
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
              Dark
            </button>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>System Updates</SectionTitle>
        <Card>
          <OtaPanel />
        </Card>
      </section>

      <section>
        <SectionTitle>Cloud Sync</SectionTitle>
        <Card>
          <SyncStatusPanel />
        </Card>
      </section>
    </div>
  )
}
