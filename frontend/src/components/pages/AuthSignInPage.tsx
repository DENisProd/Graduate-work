'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/sidebar-02/logo';
import { useTranslation } from '@/hooks';

const KNOWN_ERROR_KEYS = [
  'Configuration',
  'AccessDenied',
  'Verification',
  'OAuthSignin',
  'OAuthCallback',
  'OAuthCreateAccount',
  'EmailCreateAccount',
  'Callback',
  'OAuthAccountNotLinked',
  'EmailSignin',
  'CredentialsSignin',
  'SessionRequired',
  'Default',
] as const;

type KnownErrorKey = (typeof KNOWN_ERROR_KEYS)[number];

function resolveErrorKey(error: string | null): KnownErrorKey | null {
  if (!error) return null;
  if (KNOWN_ERROR_KEYS.includes(error as KnownErrorKey)) {
    return error as KnownErrorKey;
  }
  return 'Default';
}

function errorTranslationKey(errorKey: KnownErrorKey) {
  const map: Record<KnownErrorKey, string> = {
    Configuration: 'configuration',
    AccessDenied: 'accessDenied',
    Verification: 'verification',
    OAuthSignin: 'oauthSignin',
    OAuthCallback: 'oauthCallback',
    OAuthCreateAccount: 'oauthCreateAccount',
    EmailCreateAccount: 'emailCreateAccount',
    Callback: 'callback',
    OAuthAccountNotLinked: 'oauthAccountNotLinked',
    EmailSignin: 'emailSignin',
    CredentialsSignin: 'credentialsSignin',
    SessionRequired: 'sessionRequired',
    Default: 'default',
  };

  return `auth.signInErrors.${map[errorKey]}.subtitle` as const;
}

function resolveCallbackUrl(raw: string | null) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/dashboard';
  }
  return raw;
}

export function AuthSignInPage() {
  const searchParams = useSearchParams();
  const { t, ready } = useTranslation();
  const callbackUrl = resolveCallbackUrl(searchParams.get('callbackUrl'));
  const errorKey = resolveErrorKey(searchParams.get('error'));

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />
        <div className="absolute -bottom-36 right-[-120px] h-[520px] w-[520px] rounded-full bg-[var(--brand-teal)]/10 blur-3xl dark:bg-[var(--brand-teal)]/12" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-lg items-center px-6 py-12">
        <Card className="w-full border border-border bg-card/70 shadow-lg backdrop-blur dark:bg-card/40">
          <Card.Content className="space-y-6 p-6 md:p-8">
            <div className="space-y-4">
              <Link
                href="https://home.darksecrets.ru"
                className="inline-flex items-center gap-2.5 rounded-lg text-foreground no-underline transition-opacity hover:opacity-80"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 p-2 text-primary">
                  <Logo className="h-full w-full" />
                </span>
                <span className="text-sm font-semibold tracking-tight">{t('header.title')}</span>
              </Link>

              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">{t('auth.signInPage.title')}</h1>
                <p className="text-sm leading-6 text-muted-foreground">{t('auth.signInPage.subtitle')}</p>
              </div>
            </div>

            {errorKey && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {t(errorTranslationKey(errorKey))}
              </div>
            )}

            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onPress={() => signIn('keycloak', { callbackUrl }, { prompt: 'login' })}
              >
                {t('auth.signInPage.continue')}
              </Button>
              <p className="text-center text-xs leading-5 text-muted-foreground">
                {t('auth.signInPage.helper')}
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <Link href="/" className="text-sm font-medium text-muted-foreground no-underline hover:text-foreground">
                {t('navigation.home')}
              </Link>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
