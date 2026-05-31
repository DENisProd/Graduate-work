import { useCallback, useMemo } from 'react'
import { enUS } from 'date-fns/locale/en-US'
import { ru as ruDate } from 'date-fns/locale/ru'
import { createTranslator } from '@/i18n/translate'
import { messages } from '@/i18n/messages'
import { useSettingsStore } from '@/stores/settings.store'

export function useI18n() {
  const locale = useSettingsStore((s) => s.locale)
  const setLocale = useSettingsStore((s) => s.setLocale)

  const tree = messages[locale] ?? messages.en

  const t = useMemo(() => createTranslator(tree as unknown as Record<string, unknown>), [tree])

  const translate = useCallback(
    (key: string, vars?: Record<string, string | number | undefined>) => t(key, vars),
    [t],
  )

  const dateLocale = locale === 'ru' ? ruDate : enUS

  return {
    locale,
    setLocale,
    t: translate,
    dateLocale,
  }
}
