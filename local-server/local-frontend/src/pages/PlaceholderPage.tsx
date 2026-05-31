import { Construction } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'

interface PlaceholderPageProps {
  title: string
  sprint: string
}

export function PlaceholderPage({ title, sprint }: PlaceholderPageProps) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Construction className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
      <h1 className="mb-1 text-lg font-semibold text-slate-700 dark:text-slate-300">{title}</h1>
      <p className="text-sm text-slate-400 dark:text-slate-500">{t('placeholder.comingIn', { sprint })}</p>
    </div>
  )
}
