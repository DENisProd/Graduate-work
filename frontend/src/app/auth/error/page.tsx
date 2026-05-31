import { Suspense } from 'react';
import { AuthErrorPage } from '@/components/pages/AuthErrorPage';

export const metadata = {
  title: 'Ошибка входа',
};

function AuthErrorFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
    </div>
  );
}

export default function AuthErrorRoute() {
  return (
    <Suspense fallback={<AuthErrorFallback />}>
      <AuthErrorPage />
    </Suspense>
  );
}
