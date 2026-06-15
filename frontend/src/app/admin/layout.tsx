import { AdminLayout } from '@/components/layout';
import { ToastProvider } from '@/components/shared';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { isAccessServiceHealthy } from '@/lib/server/access-health';
import { hasPlatformAdminRole } from '@/lib/auth/jwt-roles';

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/admin');
  }

  if (!hasPlatformAdminRole(session.accessToken)) {
    redirect('/dashboard');
  }

  const accessHealthy = await isAccessServiceHealthy();
  if (!accessHealthy) {
    redirect('/503');
  }

  return (
    <ToastProvider>
      <AdminLayout>{children}</AdminLayout>
    </ToastProvider>
  );
}

