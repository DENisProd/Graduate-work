'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deviceAuthApi } from '@/lib/api/access-service';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import { useUserStore } from '@/store/user-store';
import { ApiError } from '@/lib/api/core';
import { useToast } from '@/components/shared';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

function DeviceAuthContent() {
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
      showToast('Нужно подтвердить код авторизации на этой странице', 'info', 5000);
    }
  }, [initialCode, sessionId, showToast]);

  const handleSubmit = async () => {
    if (!currentUserId) {
      setState('error');
      setMessage('Sign in first to confirm this code.');
      return;
    }
    if (!userCode.trim()) {
      setState('error');
      setMessage('User code is required.');
      return;
    }

    setState('submitting');
    setMessage(null);
    try {
      await deviceAuthApi.confirm(userCode.trim(), currentUserId, displayName || undefined);
      setState('success');
      setMessage('Code confirmed. You can return to local app and continue authorization.');
      showToast('Код подтверждён. Вернитесь в локальное приложение.', 'success', 5000);
      window.setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch (error) {
      setState('error');
      if (error instanceof ApiError) {
        setMessage(error.message);
        showToast(error.message, 'error', 5000);
      } else {
        setMessage('Failed to confirm code. Please try again.');
        showToast('Не удалось подтвердить код. Попробуйте снова.', 'error', 5000);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <Card.Header className="flex flex-col gap-1">
          <Card.Title>Device authorization</Card.Title>
          <Card.Description className="text-foreground/80">
            Confirm the one-time code from your local smart home server.
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          {!currentUserId && (
            <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground/80">
              <p>You need to sign in before confirming the code.</p>
              <Link
                href={`/api/auth/signin?callbackUrl=${encodeURIComponent('/device-auth' + (params?.toString() ? `?${params.toString()}` : ''))}`}
                className="mt-2 inline-block text-primary underline"
              >
                Sign in
              </Link>
            </div>
          )}

          {sessionId && (
            <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-foreground/70">
              Session ID: <span className="font-mono">{sessionId}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="userCode" className="text-sm font-medium">
              User code
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
            {state === 'submitting' ? 'Confirming...' : 'Confirm code'}
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}

export default function DeviceAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      }
    >
      <DeviceAuthContent />
    </Suspense>
  );
}
