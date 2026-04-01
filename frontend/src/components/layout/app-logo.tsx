'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const HomeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    height="24"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="24"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

interface AppLogoProps {
  label: string;
  href?: string;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  showLabel?: boolean;
}

export function AppLogo({
  label,
  href = '/',
  className,
  iconClassName,
  labelClassName,
  showLabel = true,
}: AppLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 font-semibold text-lg transition-colors hover:text-accent',
        className,
      )}
    >
      <HomeIcon className={cn('h-6 w-6 shrink-0 text-current', iconClassName)} />
      {showLabel && <span className={labelClassName}>{label}</span>}
    </Link>
  );
}
