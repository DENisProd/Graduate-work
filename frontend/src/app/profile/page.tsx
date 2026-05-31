import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ProfilePage } from '@/widgets/profile/ProfilePage';

export default async function ProfileRoute() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/profile');
  }

  const user = {
    id: session.user.id ?? '',
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  };

  return <ProfilePage user={user} />;
}
