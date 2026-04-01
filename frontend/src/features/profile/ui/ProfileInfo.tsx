'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks';

export interface ProfileUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ProfileInfoProps {
  user: ProfileUser;
}

export function ProfileInfo({ user }: ProfileInfoProps) {
  const { t } = useTranslation();
  const displayName = user.name ?? user.email ?? t('auth.account');
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.title')}</CardTitle>
        <CardDescription>{t('profile.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.image ?? undefined} alt={displayName} />
            <AvatarFallback className="text-xl">{initials || '?'}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <div className="text-sm text-muted-foreground">{t('profile.name')}</div>
            <div className="text-xl font-semibold">{displayName}</div>
            {user.email && (
              <div className="mt-1 text-sm text-muted-foreground">{user.email}</div>
            )}
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="profile-name" className="text-sm font-medium">
              {t('profile.name')}
            </label>
            <Input
              id="profile-name"
              value={displayName}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="profile-email" className="text-sm font-medium">
              {t('profile.email')}
            </label>
            <Input
              id="profile-email"
              type="email"
              value={user.email ?? ''}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="profile-id" className="text-sm font-medium">
              {t('profile.userId')}
            </label>
            <Input
              id="profile-id"
              value={user.id}
              readOnly
              className="bg-muted font-mono"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
