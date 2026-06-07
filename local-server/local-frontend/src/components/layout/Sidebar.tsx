import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Cpu,
  Workflow,
  Settings,
  ChevronUp,
  Users,
  DoorOpen,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { useSettingsStore } from '@/stores/settings.store'
import { AppLogo } from './app-logo'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

function initialsFromLabel(primary: string, fallbackId: string, guestLabel: string): string {
  const name = primary.trim()
  if (name && name !== guestLabel) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase().slice(0, 2)
    }
    return name.slice(0, 2).toUpperCase()
  }
  const id = fallbackId.replace(/-/g, '')
  if (id.length >= 2) return id.slice(0, 2).toUpperCase()
  return '?'
}

function shortenId(id: string): string {
  const t = id.trim()
  if (!t) return ''
  if (t.length <= 14) return t
  return `${t.slice(0, 8)}…${t.slice(-4)}`
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { t } = useI18n()

  const navItems = useMemo(
    () =>
      [
        { to: '/', labelKey: 'nav.dashboard' as const, icon: LayoutDashboard, end: true as const },
        { to: '/devices', labelKey: 'nav.devices' as const, icon: Cpu, end: false as const },
        { to: '/scenarios', labelKey: 'nav.scenarios' as const, icon: Workflow, end: false as const },
        { to: '/users', labelKey: 'nav.users' as const, icon: Users, end: false as const },
        { to: '/rooms', labelKey: 'nav.rooms' as const, icon: DoorOpen, end: false as const },
        { to: '/settings', labelKey: 'nav.settings' as const, icon: Settings, end: false as const },
      ] as const,
    [],
  )

  const authDisplayName = useSettingsStore((s) => s.authDisplayName)
  const authExternalUserId = useSettingsStore((s) => s.authExternalUserId)
  const userId = useSettingsStore((s) => s.userId)
  const currentHouseName = useSettingsStore((s) => s.currentHouseName)

  const idLine = authExternalUserId.trim() || userId.trim()
  const idShort = idLine ? shortenId(idLine) : ''
  const house = currentHouseName.trim()
  const display = authDisplayName.trim()

  const guest = t('layout.guest')
  const primary = display || idShort || guest
  const secondary =
    house ||
    (display && idShort ? idShort : '') ||
    (idLine && !display ? t('layout.noHouseSelected') : '') ||
    t('layout.setIdentityInSettings')

  const initials = initialsFromLabel(display, idLine, guest)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex h-screen w-60 flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950',
        'md:relative md:inset-auto md:z-auto md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
        <AppLogo
          label={t('header.title')}
          href="/"
          className="min-w-0 text-sm"
          labelClassName="truncate text-sm font-semibold"
        />
        <button
          onClick={onClose}
          className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-0.5">
          {navItems.map(({ to, labelKey, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end === true}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(labelKey)}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t border-slate-200 dark:border-slate-800">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-2.5 py-2.5 transition-colors',
              'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/80',
              'dark:border-slate-700/90 dark:bg-slate-950 dark:hover:border-slate-600 dark:hover:bg-slate-900/60',
              isActive && 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30',
            )
          }
        >
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              'bg-violet-100 text-indigo-900 dark:bg-violet-900/50 dark:text-violet-100',
            )}
            aria-hidden
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
              {primary}
            </p>
            <p className="mt-0.5 truncate text-xs leading-tight text-slate-500 dark:text-slate-400">
              {secondary}
            </p>
          </div>
          <ChevronUp
            className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
            strokeWidth={2}
            aria-hidden
          />
        </NavLink>
      </div>
    </aside>
    </>
  )
}
