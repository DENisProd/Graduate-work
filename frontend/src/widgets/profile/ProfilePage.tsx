'use client';

import { useTranslation } from '@/hooks';
import {
  ProfileDangerZoneCard,
  ProfileInfo,
  ProfileSettingsCard,
  type ProfileUser,
} from '@/features/profile';

interface ProfilePageProps {
  user: ProfileUser;
}

export function ProfilePage({ user }: ProfilePageProps) {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6 md:py-12">
      <div>
        <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('profile.description')}</p>
      </div>
      <ProfileInfo user={user} />
      <ProfileSettingsCard />
      <ProfileDangerZoneCard />
    </div>
  );
}
