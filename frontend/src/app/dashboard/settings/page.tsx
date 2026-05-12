'use client';

import { ProfileSettingsCard } from '@/features/profile';
import { useTranslation } from '@/hooks';

export default function DashboardSettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('settings.appearance')}</p>
      </div>

      <ProfileSettingsCard />
    </div>
  );
}
