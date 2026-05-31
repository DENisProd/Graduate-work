import { Suspense } from 'react';
import { AuthSignInPage } from '@/components/pages/AuthSignInPage';

export const metadata = {
  title: 'Вход',
};

function AuthSignInFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
    </div>
  );
}

export default function AuthSignInRoute() {
  return (
    <Suspense fallback={<AuthSignInFallback />}>
      <AuthSignInPage />
    </Suspense>
  );
}
