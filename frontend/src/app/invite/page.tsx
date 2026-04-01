'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Chip, Button } from '@heroui/react';

import { houseInvitationsApi } from '@/lib/api-client';
import type { HouseInvitationResponse } from '@/types/api';
import { useTranslation, useCurrentUserId } from '@/hooks';
import { ApiError } from '@/lib/api-client';
import Link from 'next/link';

type InvitationStatus = 'idle' | 'loading' | 'success' | 'error';

function InviteContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? undefined;

  const currentUserId = useCurrentUserId();

  const [invitation, setInvitation] = useState<HouseInvitationResponse | null>(null);
  const [loading, setLoading] = useState(!!token);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<InvitationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMessage(t('errors.invalidInvitationLink'));
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);
    houseInvitationsApi
      .getByToken(token)
      .then((data) => {
        if (!cancelled) setInvitation(data);
      })
      .catch((error) => {
        if (!cancelled) {
          if (error instanceof ApiError) {
            setErrorMessage(error.message);
          } else {
            setErrorMessage(t('common.error'));
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  const handleAccept = async () => {
    if (!token || !currentUserId) return;
    setActionLoading(true);
    setStatus('loading');
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await houseInvitationsApi.accept(token, currentUserId);
      setStatus('success');
      setSuccessMessage(t('common.success'));
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      if (error instanceof ApiError) {
        const msg = error.message.toLowerCase();
        if (msg.includes('already') || msg.includes('уже')) {
          setStatus('success');
          setSuccessMessage(t('auth.alreadyInHouse'));
          setTimeout(() => router.push('/dashboard'), 1500);
          return;
        }
        if (error.status === 400) {
          setErrorMessage(
            msg.includes('expired') || msg.includes('истек')
              ? t('errors.invitationExpired')
              : t('errors.invitationAlreadyProcessed')
          );
        } else if (error.status === 404) {
          setErrorMessage(t('errors.invitationNotFound'));
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage(t('common.error'));
      }
      setStatus('error');
    } finally {
      setActionLoading(false);
    }
  };

  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <Card.Header className="flex flex-col gap-1">
          <Card.Title>{t('admin.accessControl.invitations')}</Card.Title>
          <Card.Description className="text-foreground/80">
            {t('common.welcome')}
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          {loading && (
            <div className="flex justify-center py-8 text-sm text-foreground/70">
              {t('common.loading')}
            </div>
          )}

          {!loading && !token && errorMessage && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          {!loading && token && !invitation && !errorMessage && (
            <div className="text-sm text-foreground/70">{t('errors.notFound')}</div>
          )}

          {!loading && token && errorMessage && !invitation && (
            <div className="space-y-3">
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
              <p className="text-xs text-foreground/70">
                {t('errors.invitationTryAccept')}
              </p>
              {currentUserId && (
                <Button
                  variant="primary"
                  fullWidth
                  isDisabled={actionLoading || isSuccess}
                  onPress={handleAccept}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {t('common.accept')}
                </Button>
              )}
            </div>
          )}

          {!loading && invitation && (
            <>
              <div className="space-y-1">
                <p className="text-sm text-foreground/80">{invitation.email}</p>
                <p className="text-lg font-semibold">
                  {invitation.houseName ?? t('admin.accessControl.houses')}
                </p>
                {invitation.status && <Chip size="sm">{invitation.status}</Chip>}
              </div>

              {invitation.expiresAt && (
                <p className="text-xs text-foreground/70">
                  {t('admin.accessControl.expiresAt')}:{' '}
                  {new Date(invitation.expiresAt).toLocaleString()}
                </p>
              )}

              {currentUserId == null && (
                <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-foreground/80">
                  {t('auth.enterUserId')}
                  <div className="mt-2">
                    <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/invite?token=${token}`)}`} className="text-primary underline">
                      {t('common.signIn')}
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  isDisabled={currentUserId == null || actionLoading || isSuccess}
                  onPress={handleAccept}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {t('common.accept')}
                </Button>
              </div>

              {isSuccess && (
                <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
                  {successMessage ?? t('common.success')}
                </div>
              )}

              {isError && errorMessage && (
                <div className="text-sm text-destructive">{errorMessage}</div>
              )}
            </>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-muted-foreground">Loading…</span>
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
