'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHousePermissions } from '@/hooks';
import { RolesTab } from '@/features/access-control/ui/house-details';

export default function HouseRolesPage() {
  const params = useParams();
  const router = useRouter();
  const houseId = (params?.houseId as string | undefined) ?? null;
  const perms = useHousePermissions();

  useEffect(() => {
    if (!perms.loading && !perms.canEditRoles) {
      router.replace(houseId ? `/dashboard/houses/${encodeURIComponent(houseId)}` : '/dashboard');
    }
  }, [perms.loading, perms.canEditRoles, houseId, router]);

  if (!perms.canEditRoles) return null;

  return <RolesTab houseId={houseId} activeTab="roles" canEditRoles={perms.canEditRoles} />;
}
