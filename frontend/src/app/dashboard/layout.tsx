import { DashboardLayout } from '@/components/features/dashboard/layout';
import { ToastProvider } from '@/components/shared';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/api/auth/signin?callbackUrl=/dashboard');
  }

  return (
    <ToastProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </ToastProvider>
  );
}
