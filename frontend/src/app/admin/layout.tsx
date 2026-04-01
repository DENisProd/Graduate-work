import { AdminLayout } from '@/components/layout';
import { ToastProvider } from '@/components/shared';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // if (!session?.user) {
  //   redirect('/api/auth/signin?callbackUrl=/admin');
  // }

  return (
    <ToastProvider>
      <AdminLayout>{children}</AdminLayout>
    </ToastProvider>
  );
}

