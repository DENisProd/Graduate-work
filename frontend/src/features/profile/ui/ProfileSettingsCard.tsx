'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage, useTheme, useTranslation } from '@/hooks';
import { i18nConfig, localeNames } from '@/config';
import type { Locale, ThemeMode } from '@/types';

export function ProfileSettingsCard() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.title')}</CardTitle>
        <CardDescription>{t('settings.appearance')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="profile-theme" className="text-sm font-medium">
            {t('settings.theme')}
          </label>
          <Select value={theme} onValueChange={(value) => setTheme(value as ThemeMode)}>
            <SelectTrigger id="profile-theme">
              <SelectValue placeholder={t('settings.theme')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t('theme.light')}</SelectItem>
              <SelectItem value="dark">{t('theme.dark')}</SelectItem>
              <SelectItem value="system">{t('theme.system')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="profile-language" className="text-sm font-medium">
            {t('settings.language')}
          </label>
          <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
            <SelectTrigger id="profile-language">
              <SelectValue placeholder={t('settings.language')} />
            </SelectTrigger>
            <SelectContent>
              {i18nConfig.locales.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {localeNames[loc]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
