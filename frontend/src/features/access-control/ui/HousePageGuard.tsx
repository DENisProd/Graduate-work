'use client';

import { useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks';
import { useHousePageAccess } from '@/hooks/use-house-page-access';
import { pathnameToHousePageSlug } from '@/lib/house-pages';
import { hasPlatformAdminRole } from '@/lib/auth/jwt-roles';
import { useAccessControlStore } from '@/store/access-control-store';

type SessionWithToken = { accessToken?: string | null };

export function HousePageGuard({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const house = useAccessControlStore((s) => s.house);
  const houseId = (params?.houseId as string | undefined) ?? null;
  const isPlatformAdmin = hasPlatformAdminRole((session as SessionWithToken | null)?.accessToken);
  const { loading, canRead } = useHousePageAccess({
    ownerId: house?.ownerId,
    isPlatformAdmin,
  });

  const slug = houseId ? pathnameToHousePageSlug(pathname, houseId) : 'overview';
  const allowed = canRead(slug);

  useEffect(() => {
    if (!houseId || loading || allowed) return;
    router.replace(`/dashboard/houses/${encodeURIComponent(houseId)}`);
  }, [allowed, houseId, loading, router]);

  if (!houseId) return <>{children}</>;
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }
  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-medium text-foreground">{t('common.error')}</p>
        <p className="text-sm text-muted-foreground">{t('admin.accessControl.noAccess')}</p>
      </div>
    );
  }

  return <>{children}</>;
}
