'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHousePermissions } from '@/hooks';
import { SettingsTab } from '@/features/access-control/ui/house-details/tabs/SettingsTab';

export default function HouseSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const houseId = (params?.houseId as string | undefined) ?? null;
  const perms = useHousePermissions();

  useEffect(() => {
    if (!perms.loading && !perms.isOwner) {
      router.replace(houseId ? `/dashboard/houses/${encodeURIComponent(houseId)}` : '/dashboard');
    }
  }, [perms.loading, perms.isOwner, houseId, router]);

  if (!perms.isOwner) return null;

  return <SettingsTab houseId={houseId} canManage={perms.isOwner} />;
}
