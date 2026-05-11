import { en } from './en'
import { ru } from './ru'

export type AppLocale = 'en' | 'ru'

export const messages: Record<AppLocale, typeof en> = {
  en,
  ru,
}

export { en, ru }
