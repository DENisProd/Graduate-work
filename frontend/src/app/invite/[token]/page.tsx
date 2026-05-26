'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks';

/** Редирект со старого URL /invite/[token] на канонический /invite?token=... */
export default function InviteTokenRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const token = params?.token as string | undefined;

  useEffect(() => {
    if (token) {
      router.replace(`/invite?token=${encodeURIComponent(token)}`);
    } else {
      router.replace('/invite');
    }
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="text-muted-foreground">{t('invite.redirecting')}</span>
    </div>
  );
}
