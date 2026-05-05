'use client';

import { useTranslation } from '@/hooks';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function AdminPage() {
  const { t, ready } = useTranslation();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('admin.subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/devices">
          <Card className="cursor-pointer transition-all hover:shadow-lg">
            <Card.Header>
              <Card.Title>{t('admin.tabs.devices')}</Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-muted-foreground">{t('admin.devices.title')}</p>
            </Card.Content>
          </Card>
        </Link>

        <Link href="/admin/device-types">
          <Card className="cursor-pointer transition-all hover:shadow-lg">
            <Card.Header>
              <Card.Title>{t('admin.tabs.deviceTypes')}</Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-muted-foreground">{t('admin.deviceTypes.title')}</p>
            </Card.Content>
          </Card>
        </Link>

        <Link href="/admin/device-categories">
          <Card className="cursor-pointer transition-all hover:shadow-lg">
            <Card.Header>
              <Card.Title>{t('admin.tabs.deviceCategories')}</Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-muted-foreground">{t('admin.deviceCategories.title')}</p>
            </Card.Content>
          </Card>
        </Link>

        <Link href="/admin/access-control">
          <Card className="cursor-pointer transition-all hover:shadow-lg">
            <Card.Header>
              <Card.Title>{t('admin.tabs.accessControl')}</Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-muted-foreground">{t('admin.accessControl.title')}</p>
            </Card.Content>
          </Card>
        </Link>
      </div>
    </div>
  );
}

