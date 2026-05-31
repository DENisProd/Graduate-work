'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deviceAuthApi } from '@/lib/api/access-service';
import { useTranslation } from '@/hooks';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import { useUserStore } from '@/store/user-store';
import { ApiError } from '@/lib/api/core';
import { useToast } from '@/components/shared';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

function DeviceAuthContent() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const router = useRouter();
  const currentUserId = useCurrentUserId();
  const displayName = useUserStore((s) => s.user?.name ?? '');
  const { showToast } = useToast();
  const initialCode = useMemo(() => params?.get('userCode') ?? '', [params]);
  const sessionId = params?.get('sessionId') ?? '';

  const [userCode, setUserCode] = useState(initialCode);
  const [state, setState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialCode || sessionId) {
      showToast(t('deviceAuth.toasts.confirmOnPage'), 'info', 5000);
    }
  }, [initialCode, sessionId, showToast, t]);

  const handleSubmit = async () => {
    if (!currentUserId) {
      setState('error');
      setMessage(t('deviceAuth.errors.signInRequired'));
      return;
    }
    if (!userCode.trim()) {
      setState('error');
      setMessage(t('deviceAuth.errors.userCodeRequired'));
      return;
    }

    setState('submitting');
    setMessage(null);
    try {
      await deviceAuthApi.confirm(userCode.trim(), currentUserId, displayName || undefined);
      setState('success');
      setMessage(t('deviceAuth.messages.confirmed'));
      showToast(t('deviceAuth.toasts.confirmed'), 'success', 5000);
      window.setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch (error) {
      setState('error');
      if (error instanceof ApiError) {
        setMessage(error.message);
        showToast(error.message, 'error', 5000);
      } else {
        setMessage(t('deviceAuth.errors.confirmFailed'));
        showToast(t('deviceAuth.errors.confirmFailed'), 'error', 5000);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <Card.Header className="flex flex-col gap-1">
          <Card.Title>{t('deviceAuth.title')}</Card.Title>
          <Card.Description className="text-foreground/80">
            {t('deviceAuth.description')}
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          {!currentUserId && (
            <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground/80">
              <p>{t('deviceAuth.signInRequired')}</p>
              <Link
                href={`/auth/signin?callbackUrl=${encodeURIComponent('/device-auth' + (params?.toString() ? `?${params.toString()}` : ''))}`}
                className="mt-2 inline-block text-primary underline"
              >
                {t('common.signIn')}
              </Link>
            </div>
          )}

          {sessionId && (
            <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-foreground/70">
              {t('deviceAuth.sessionId')}: <span className="font-mono">{sessionId}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="userCode" className="text-sm font-medium">
              {t('deviceAuth.userCode')}
            </label>
            <Input
              id="userCode"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value.toUpperCase())}
              placeholder="ABCD-EFGH"
              className="font-mono"
              autoComplete="off"
            />
          </div>

          {message && (
            <div
              className={`rounded-md px-3 py-2 text-sm ${
                state === 'success'
                  ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                  : 'border border-destructive/40 bg-destructive/10 text-destructive'
              }`}
            >
              {message}
            </div>
          )}

          <Button
            variant="primary"
            fullWidth
            isDisabled={state === 'submitting'}
            onPress={handleSubmit}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {state === 'submitting' ? t('deviceAuth.confirming') : t('deviceAuth.confirmCode')}
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}

export default function DeviceAuthPage() {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-muted-foreground">{t('common.loading')}</span>
        </div>
      }
    >
      <DeviceAuthContent />
    </Suspense>
  );
}
