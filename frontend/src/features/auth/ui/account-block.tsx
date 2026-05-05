'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/animate-ui/components/radix/dropdown-menu';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useUserStore } from '@/store/user-store';

function UserAvatar({
  name,
  avatarUrl,
  className,
}: {
  name: string;
  avatarUrl?: string;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`h-[30px] w-[30px] shrink-0 rounded-full object-cover ${className ?? ''}`}
      />
    );
  }
  return (
    <div
      className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-medium ${className ?? ''}`}
      aria-hidden
    >
      {initials || '?'}
    </div>
  );
}

export function AccountBlock() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const logoutStore = useUserStore((s) => s.logout);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    logoutStore();
    router.push('/');
  };

  if (status === 'loading') {
    return (
      <Button variant="ghost" size="sm" isDisabled>
        {t('common.loading')}
      </Button>
    );
  }

  const user = session?.user;

  if (!user) {
    return (
      <Button
        variant="secondary"
        size="sm"
        className="bg-accent text-accent-foreground hover:opacity-90"
        onPress={() => signIn('keycloak', {}, { prompt: 'login' })}
      >
        {t('auth.login')}
      </Button>
    );
  }

  const displayName = user.name ?? user.email ?? t('auth.account');
  const avatarUrl = user.image ?? undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 min-w-0 gap-2 px-2"
          aria-label={t('auth.account')}
        >
          <UserAvatar name={displayName} avatarUrl={avatarUrl} />
          <span className="hidden max-w-[120px] truncate text-left text-sm font-medium sm:inline">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <DropdownMenuItem>
          <Link href="/profile" className="w-full">
            {t('auth.profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          {t('auth.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
