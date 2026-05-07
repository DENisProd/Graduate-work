import { AdminLayout } from '@/components/layout';
import { ToastProvider } from '@/components/shared';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { isAccessServiceHealthy } from '@/lib/server/access-health';

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // if (!session?.user) {
  //   redirect('/api/auth/signin?callbackUrl=/admin');
  // }

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

