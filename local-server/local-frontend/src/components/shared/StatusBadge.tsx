import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'

type Variant = 'online' | 'offline' | 'unknown' | 'error' | 'on' | 'off'

const STYLES: Record<Variant, string> = {
  online: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  offline: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  unknown: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  on: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  off: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

const DOTS: Record<Variant, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-400',
  unknown: 'bg-amber-500',
  error: 'bg-red-500',
  on: 'bg-blue-500',
  off: 'bg-slate-400',
}

interface StatusBadgeProps {
  variant: Variant
  label?: string
  pulse?: boolean
  className?: string
}

const VARIANT_KEY: Record<Variant, 'statusBadge.online' | 'statusBadge.offline' | 'statusBadge.unknown' | 'statusBadge.error' | 'statusBadge.on' | 'statusBadge.off'> = {
  online: 'statusBadge.online',
  offline: 'statusBadge.offline',
  unknown: 'statusBadge.unknown',
  error: 'statusBadge.error',
  on: 'statusBadge.on',
  off: 'statusBadge.off',
}

export function StatusBadge({ variant, label, pulse = false, className }: StatusBadgeProps) {
  const { t } = useI18n()
  const text = label ?? t(VARIANT_KEY[variant])
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        STYLES[variant],
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          DOTS[variant],
          pulse && variant !== 'offline' && 'animate-pulse',
        )}
      />
      {text}
    </span>
  )
}
