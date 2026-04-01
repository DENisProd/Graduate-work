'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks';
import { signOut } from 'next-auth/react';
import { useUserStore } from '@/store/user-store';

export function ProfileDangerZoneCard() {
  const router = useRouter();
  const { t } = useTranslation();
  const logoutStore = useUserStore((s) => s.logout);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    logoutStore();
    router.push('/');
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">{t('profile.dangerZone')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={() => {
            void handleSignOut();
          }}
          className="w-full"
        >
          {t('auth.logout')}
        </Button>
      </CardContent>
    </Card>
  );
}
